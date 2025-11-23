import prisma from '../db'
import { requireSuperAdmin } from '../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  // Get all super admin users
  const superAdmins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return superAdmins.map(admin => ({
    id: admin.id,
    name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email,
    username: admin.email.split('@')[0],
    email: admin.email,
    role: admin.role.toLowerCase(),
    createdAt: admin.createdAt.toISOString()
  }))
})
