import { randomUUID } from 'crypto'

import { eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'

import prisma from '../../db'

const bodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phoneNumber: z.string().trim().min(5).max(32)
})

export default eventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  const normalizedPhone = body.phoneNumber.replace(/\D/g, '') || randomUUID()
  const guestEmail = `${normalizedPhone}@guest.chat`

  // Find or create a lightweight customer account for chat access.
  const existingUser = await prisma.user.findFirst({
    where: { phoneNumber: body.phoneNumber }
  })

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: existingUser.name ?? body.name ?? null,
          phoneNumber: body.phoneNumber ?? existingUser.phoneNumber ?? null,
          lastSession: new Date()
        }
      })
    : await prisma.user.create({
        data: {
          email: guestEmail,
          name: body.name ?? null,
          phoneNumber: body.phoneNumber ?? null,
          authProviderId: `guest_${randomUUID()}`,
          role: 'CUSTOMER',
          isActive: true,
          lastSession: new Date()
        }
      })

  // Ensure a conversation exists for this user.
  let conversation = await prisma.conversation.findUnique({
    where: { userId: user.id }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        lastMessageAt: new Date()
      }
    })
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber
    },
    conversationId: conversation.id
  }
})
