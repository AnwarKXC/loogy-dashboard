import { z } from 'zod'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import prisma from '../../db'

const updateSchema = z.object({
  notifyOrders: z.boolean(),
  notifyMessages: z.boolean()
})

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdmin(event)
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.flatten()
    })
  }

  const admin = await prisma.admin.update({
    where: { id: session.id },
    data: {
      notifyOrders: result.data.notifyOrders,
      notifyMessages: result.data.notifyMessages
    },
    select: {
      notifyOrders: true,
      notifyMessages: true
    }
  })

  return admin
})
