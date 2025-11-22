import prisma from '../../db'
import { z } from 'zod'

const querySchema = z.object({
  conversationId: z.string().uuid()
})

export default eventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)

  const messages = await prisma.chat.findMany({
    where: {
      conversationId: query.conversationId
    },
    orderBy: {
      createdAt: 'asc'
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

  return messages.map(msg => ({
    id: msg.id,
    conversationId: msg.conversationId,
    userId: msg.userId,
    user: msg.user,
    content: msg.content,
    isFromAdmin: msg.isFromAdmin,
    status: msg.status,
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString()
  }))
})
