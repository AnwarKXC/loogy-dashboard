import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

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
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      analytics: true
    },
    orderBy: { lastMessageAt: 'desc' }
  })

  return conversations.map(conv => ({
    id: conv.id,
    userId: conv.userId,
    user: conv.user,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    lastMessageContent: conv.lastMessageContent,
    unreadCount: conv.unreadCount,
    isActive: conv.isActive,
    lastMessage: conv.messages[0]
      ? {
          id: conv.messages[0].id,
          content: conv.messages[0].content,
          isFromAdmin: conv.messages[0].isFromAdmin,
          createdAt: conv.messages[0].createdAt.toISOString(),
          status: conv.messages[0].status
        }
      : null,
    analytics: conv.analytics
  }))
})
