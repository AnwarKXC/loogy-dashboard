import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'http'
import prisma from '../db'
import { whatsappService } from '../utils/whatsapp'

interface ChatMessage {
  conversationId: string
  userId: number
  content: string
  isFromAdmin: boolean
}

interface TypingIndicator {
  conversationId: string
  userId: number
  isTyping: boolean
  isAdmin: boolean
}

interface MessageStatus {
  messageId: string
  status: 'delivered' | 'seen'
}

// Track typing states
const typingUsers = new Map<string, Set<number>>()

export function initializeSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join user/admin to their room
    socket.on('join', async (data: { userId: number, isAdmin: boolean }) => {
      const { userId, isAdmin } = data

      if (isAdmin) {
        // Admin joins admin room to receive all messages
        socket.join('admin-room')
        console.log('Admin joined room:', socket.id)

        // Send all active conversations
        const conversations = await prisma.conversation.findMany({
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
            },
            messages: {
              take: 50,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { lastMessageAt: 'desc' }
        })

        socket.emit('conversations:list', conversations)
      } else {
        // User joins their conversation room
        socket.join(`user-${userId}`)
        console.log(`User ${userId} joined room`)

        // Get or create conversation
        let conversation = await prisma.conversation.findUnique({
          where: { userId },
          include: {
            messages: {
              take: 50,
              orderBy: { createdAt: 'desc' }
            }
          }
        })

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              userId,
              lastMessageAt: new Date()
            },
            include: {
              messages: true
            }
          })

          // Create analytics record
          await prisma.conversationAnalytics.create({
            data: {
              conversationId: conversation.id
            }
          })
        }

        socket.emit('conversation:joined', conversation)
      }
    })

    // Handle new message
    socket.on('message:send', async (data: ChatMessage) => {
      try {
        const { conversationId, userId, content, isFromAdmin } = data

        // Get conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            user: true,
            analytics: true
          }
        })

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        // Calculate response time if this is admin reply
        let responseTimeMs: number | undefined
        if (isFromAdmin && conversation.lastMessageAt) {
          const lastUserMessage = await prisma.chat.findFirst({
            where: {
              conversationId,
              isFromAdmin: false
            },
            orderBy: { createdAt: 'desc' }
          })

          if (lastUserMessage) {
            responseTimeMs = Date.now() - lastUserMessage.createdAt.getTime()
          }
        }

        // Save message to database
        const message = await prisma.chat.create({
          data: {
            conversationId,
            userId: isFromAdmin ? null : userId,
            content,
            isFromAdmin,
            status: 'SENT'
          }
        })

        // Update conversation
        const updateData: any = {
          lastMessageAt: new Date(),
          lastMessageContent: content
        }

        if (isFromAdmin) {
          updateData.adminLastRepliedAt = new Date()
          updateData.unreadCount = 0 // Reset unread when admin replies
          // Reset WhatsApp throttle when admin replies
          whatsappService.resetThrottle(userId)
        } else {
          updateData.unreadCount = { increment: 1 }
        }

        await prisma.conversation.update({
          where: { id: conversationId },
          data: updateData
        })

        // Update analytics
        const analyticsUpdate: any = {
          totalMessages: { increment: 1 }
        }

        if (isFromAdmin) {
          analyticsUpdate.adminMessages = { increment: 1 }
          if (responseTimeMs !== undefined) {
            analyticsUpdate.lastResponseTimeMs = responseTimeMs
            if (!conversation.analytics?.firstResponseTimeMs) {
              analyticsUpdate.firstResponseTimeMs = responseTimeMs
            }
            // Update average response time
            const currentAvg = conversation.analytics?.avgResponseTimeMs || 0
            const adminMsgCount = (conversation.analytics?.adminMessages || 0) + 1
            analyticsUpdate.avgResponseTimeMs = Math.round(
              (currentAvg * (adminMsgCount - 1) + responseTimeMs) / adminMsgCount
            )
          }
        } else {
          analyticsUpdate.userMessages = { increment: 1 }
        }

        await prisma.conversationAnalytics.update({
          where: { conversationId },
          data: analyticsUpdate
        })

        // Emit to appropriate rooms
        if (isFromAdmin) {
          // Admin sent message - emit to user
          io.to(`user-${userId}`).emit('message:new', {
            ...message,
            createdAt: message.createdAt.toISOString()
          })
          // Also emit back to admin room
          io.to('admin-room').emit('message:new', {
            ...message,
            conversationId,
            userId,
            createdAt: message.createdAt.toISOString()
          })
        } else {
          // User sent message - emit to admin and send WhatsApp notification
          io.to('admin-room').emit('message:new', {
            ...message,
            conversationId,
            userId,
            userName: conversation.user.name,
            userEmail: conversation.user.email,
            createdAt: message.createdAt.toISOString()
          })

          // Send WhatsApp notification to admin
          await whatsappService.notifyAdminNewMessage(
            userId,
            conversation.user.name,
            content,
            conversationId
          )
        }

        // Update message status to delivered
        await prisma.chat.update({
          where: { id: message.id },
          data: { status: 'DELIVERED' }
        })

        // Emit delivery status
        socket.emit('message:delivered', {
          messageId: message.id,
          status: 'delivered'
        })

        // Clear typing indicator
        const typingSet = typingUsers.get(conversationId)
        if (typingSet) {
          typingSet.delete(userId)
        }
        io.to(`user-${userId}`).emit('typing:stop', { conversationId, userId, isAdmin: isFromAdmin })
        io.to('admin-room').emit('typing:stop', { conversationId, userId, isAdmin: isFromAdmin })
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicator
    socket.on('typing:start', (data: TypingIndicator) => {
      const { conversationId, userId, isAdmin } = data

      // Track typing state
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set())
      }
      typingUsers.get(conversationId)!.add(userId)

      // Emit to appropriate room
      if (isAdmin) {
        io.to(`user-${userId}`).emit('typing:start', { conversationId, isAdmin: true })
      } else {
        io.to('admin-room').emit('typing:start', { conversationId, userId, isAdmin: false })
      }
    })

    socket.on('typing:stop', (data: TypingIndicator) => {
      const { conversationId, userId, isAdmin } = data

      // Remove from typing state
      const typingSet = typingUsers.get(conversationId)
      if (typingSet) {
        typingSet.delete(userId)
      }

      // Emit to appropriate room
      if (isAdmin) {
        io.to(`user-${userId}`).emit('typing:stop', { conversationId, isAdmin: true })
      } else {
        io.to('admin-room').emit('typing:stop', { conversationId, userId, isAdmin: false })
      }
    })

    // Handle message status updates
    socket.on('message:status', async (data: MessageStatus) => {
      const { messageId, status } = data

      try {
        await prisma.chat.update({
          where: { id: messageId },
          data: {
            status: status === 'delivered' ? 'DELIVERED' : 'SEEN',
            updatedAt: new Date()
          }
        })

        // Broadcast status update
        io.emit('message:status:updated', { messageId, status })
      } catch (error) {
        console.error('Error updating message status:', error)
      }
    })

    // Mark all messages as seen when conversation is opened
    socket.on('conversation:opened', async (data: { conversationId: string, userId: number, isAdmin: boolean }) => {
      try {
        const { conversationId, isAdmin } = data

        if (isAdmin) {
          // Admin opened conversation - mark all unread messages as seen
          await prisma.chat.updateMany({
            where: {
              conversationId,
              isFromAdmin: false,
              status: { not: 'SEEN' }
            },
            data: {
              status: 'SEEN',
              updatedAt: new Date()
            }
          })

          // Reset unread count
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { unreadCount: 0 }
          })
        } else {
          // User opened conversation - mark admin messages as seen
          await prisma.chat.updateMany({
            where: {
              conversationId,
              isFromAdmin: true,
              status: { not: 'SEEN' }
            },
            data: {
              status: 'SEEN',
              updatedAt: new Date()
            }
          })
        }

        io.to('admin-room').emit('conversation:seen', { conversationId })
      } catch (error) {
        console.error('Error marking conversation as seen:', error)
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      // Clean up typing indicators
      typingUsers.forEach((users, conversationId) => {
        users.forEach((userId) => {
          io.to('admin-room').emit('typing:stop', { conversationId, userId, isAdmin: false })
        })
      })
    })
  })

  return io
}
