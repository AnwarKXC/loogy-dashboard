import { requireSuperAdmin } from '../../utils/superadmin-session'
import prisma from '../../db'

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdmin(event)

  const admin = await prisma.superAdmin.findUnique({
    where: { id: session.id },
    select: {
      notifyOrders: true,
      notifyMessages: true
    }
  })

  if (!admin) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin not found'
    })
  }

  return admin
})
