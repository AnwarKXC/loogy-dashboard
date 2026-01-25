import { z } from 'zod'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import prisma from '../../db'

const updateSchema = z.object({
  notifyOrders: z.boolean(),
  notifyMessages: z.boolean().optional() // Not in schema, ignored
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
      notifyOrders: result.data.notifyOrders
    },
    select: {
      notifyOrders: true
    }
  })

  return {
    notifyOrders: admin.notifyOrders,
    notifyMessages: false // Field not in schema, default to false
  }
})
