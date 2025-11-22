import prisma from '../../db'
import { z } from 'zod'

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  userId: z.number().int().positive().optional()
})

export default eventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  // Check if user is admin (from session)
  const session = event.context.session
  const isAdmin = session?.user?.role === 'ADMIN' || !!session?.superAdmin

  const message = await prisma.chat.create({
    data: {
      conversationId: body.conversationId,
      userId: isAdmin ? null : body.userId,
      content: body.content,
      isFromAdmin: isAdmin,
      status: 'SENT'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  // Update conversation last message
  await prisma.conversation.update({
    where: { id: body.conversationId },
    data: {
      lastMessageAt: new Date(),
      lastMessageContent: body.content,
      unreadCount: isAdmin ? { set: 0 } : { increment: 1 }
    }
  })

  // Update analytics
  const analyticsUpdate = {
    totalMessages: { increment: 1 },
    userMessages: isAdmin ? undefined : { increment: 1 },
    adminMessages: isAdmin ? { increment: 1 } : undefined
  }

  await prisma.conversationAnalytics.update({
    where: { conversationId: body.conversationId },
    data: Object.fromEntries(
      Object.entries(analyticsUpdate).filter(([_, v]) => v !== undefined)
    )
  })

  return {
    id: message.id,
    conversationId: message.conversationId,
    userId: message.userId,
    user: message.user,
    content: message.content,
    isFromAdmin: message.isFromAdmin,
    status: message.status,
    createdAt: message.createdAt.toISOString()
  }
})
