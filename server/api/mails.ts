import prisma from '../db'
import { requireSuperAdmin } from '../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  // Get recent conversations as inbox messages
  const conversations = await prisma.conversation.findMany({
    where: {
      isActive: true
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    },
    orderBy: {
      lastMessageAt: 'desc'
    },
    take: 50
  })

  return conversations.map(conv => ({
    id: conv.id,
    unread: conv.unreadCount > 0,
    from: {
      name: conv.user.name,
      email: conv.user.email,
      avatar: {
        src: `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.name)}&background=random`
      }
    },
    subject: `Message from ${conv.user.name}`,
    body: conv.lastMessageContent || 'No messages yet',
    date: conv.lastMessageAt.toISOString(),
    conversationId: conv.id,
    messageCount: conv.unreadCount
  }))
})
