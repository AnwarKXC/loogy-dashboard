import prisma from '../../db'
import { getIO } from '../../sockets/chat.gateway'
import { whatsappService } from '../../utils/whatsapp'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const io = getIO()

  // Log incoming webhook for debugging
  // console.log('WhatsApp Webhook:', JSON.stringify(body, null, 2))

  try {
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              // Handle incoming message
              const from = message.from // Phone number
              const messageType = message.type
              let content = ''

              // Extract content based on type
              if (messageType === 'text') {
                content = message.text.body
              } else if (messageType === 'image') {
                content = '[Image]' // TODO: Handle media
              } else {
                content = `[${messageType}]`
              }

              // Find user by phone number
              // WhatsApp numbers come as "15551234567", we might store as "+15551234567" or "15551234567"
              // Let's try to match loosely
              let user = await prisma.user.findFirst({
                where: {
                  OR: [
                    { phoneNumber: from },
                    { phoneNumber: `+${from}` },
                    { phoneNumber: from.replace(/^(\d{1,3})/, '+$1') } // Try adding + to country code
                  ]
                }
              })

              // If user doesn't exist, create a temporary one or ignore?
              // For now, let's create a "Guest" user if not found, or maybe we require them to be registered?
              // Better: Create a lead/guest user
              if (!user) {
                // Check if we have a name from WhatsApp profile
                const profileName = change.value.contacts?.[0]?.profile?.name || 'WhatsApp User'

                user = await prisma.user.create({
                  data: {
                    email: `${from}@whatsapp.guest`, // Placeholder email
                    name: profileName,
                    phoneNumber: from,
                    role: 'CUSTOMER', // Or 'GUEST' if you have that role
                    status: 'subscribed',
                    password: '', // No password
                    location: 'Unknown'
                  }
                })
              }

              // Find or create conversation
              let conversation = await prisma.conversation.findUnique({
                where: { userId: user.id },
                include: {
                  user: true,
                  analytics: true
                }
              })

              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: {
                    userId: user.id,
                    lastMessageAt: new Date(),
                    isActive: true
                  },
                  include: {
                    user: true,
                    analytics: true
                  }
                })

                await prisma.conversationAnalytics.create({
                  data: { conversationId: conversation.id }
                })
              }

              // Save message to DB
              const chatMessage = await prisma.chat.create({
                data: {
                  conversationId: conversation.id,
                  userId: user.id,
                  content,
                  isFromAdmin: false,
                  status: 'DELIVERED' // Received from user means delivered to us
                }
              })

              // Update conversation
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  lastMessageAt: new Date(),
                  lastMessageContent: content,
                  unreadCount: { increment: 1 },
                  isActive: true
                }
              })

              // Update analytics
              await prisma.conversationAnalytics.update({
                where: { conversationId: conversation.id },
                data: {
                  totalMessages: { increment: 1 },
                  userMessages: { increment: 1 }
                }
              })

              // Emit to Socket.io (Admin Room)
              if (io) {
                io.to('admin-room').emit('message:new', {
                  ...chatMessage,
                  conversationId: conversation.id,
                  userId: user.id,
                  userName: user.name,
                  userEmail: user.email,
                  createdAt: chatMessage.createdAt.toISOString()
                })

                // Also emit to user's room (if they happen to be online on web too)
                io.to(`user-${user.id}`).emit('message:new', {
                  ...chatMessage,
                  createdAt: chatMessage.createdAt.toISOString()
                })
              }

              // Notify Admin via WhatsApp (if configured)
              await whatsappService.notifyAdminNewMessage(
                user.id,
                user.name,
                content,
                conversation.id
              )
            }
          }

          // Handle message status updates (sent, delivered, read)
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              // We need to map WhatsApp message ID to our DB message ID
              // But we didn't store WhatsApp Message ID in Chat model yet
              // We might need to add `whatsappMessageId` to Chat model if we want precise status tracking
              // For now, we can skip this or try to match by timestamp/user
              console.log('Message status update:', status.status, status.id)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    // Return 200 OK anyway to prevent WhatsApp from retrying indefinitely
  }

  return { status: 'ok' }
})
