import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'http'
import prisma from '../db'
import { notifyAdmins } from '../utils/web-push'

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

let ioInstance: SocketServer | null = null

export function getIO() {
  return ioInstance
}

export function initializeSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  ioInstance = io

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join user/admin to their room
    socket.on('join', async (data: { userId: number, isAdmin: boolean }) => {
      const { userId, isAdmin } = data
      console.log('👤 Join request:', { userId, isAdmin, socketId: socket.id })

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
        }

        socket.emit('conversation:joined', conversation)
      }
    })

    // Handle new message
    socket.on('message:send', async (data: ChatMessage) => {
      try {
        console.log('📨 Received message:send event:', data)
        const { conversationId, userId, content, isFromAdmin } = data

        // Get conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            user: true
          }
        })

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' })
          return
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
        const updateData: {
          lastMessageAt: Date
          lastMessageContent: string
          adminLastRepliedAt?: Date
          unreadCount: number | { increment: number }
        } = {
          lastMessageAt: new Date(),
          lastMessageContent: content,
          unreadCount: 0 // Default value, will be overwritten
        }

        if (isFromAdmin) {
          updateData.adminLastRepliedAt = new Date()
          updateData.unreadCount = 0 // Reset unread when admin replies
        } else {
          updateData.unreadCount = { increment: 1 }
        }

        await prisma.conversation.update({
          where: { id: conversationId },
          data: updateData
        })

        // Normalize emitted payload with delivered status and ISO date
        const emittedMessage = {
          ...message,
          status: 'DELIVERED' as const,
          conversationId,
          userId,
          createdAt: message.createdAt.toISOString()
        }

        // Emit to appropriate rooms
        if (isFromAdmin) {
          // Admin sent message - emit to user
          io.to(`user-${userId}`).emit('message:new', emittedMessage)
          // Also emit back to admin room
          io.to('admin-room').emit('message:new', emittedMessage)
        } else {
          // User sent message - emit to admin and send WhatsApp notification
          io.to('admin-room').emit('message:new', {
            ...emittedMessage,
            userName: conversation.user.name,
            userEmail: conversation.user.email
          })

          // Echo back to the user so they see their sent message immediately
          io.to(`user-${userId}`).emit('message:new', {
            ...emittedMessage,
            userName: conversation.user.name,
            userEmail: conversation.user.email
          })

          // Send Web Push notification to admin
          await notifyAdmins(
            `New Message from ${conversation.user.name}`,
            content,
            `/chat?id=${conversationId}`,
            'MESSAGE'
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
