import { eventHandler } from 'h3'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const accounts = await prisma.superAdmin.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  })

  return {
    superAdmins: accounts
  }
})
