import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  // Get or create singleton settings
  let settings = await prisma.contactSettings.findFirst()

  if (!settings) {
    settings = await prisma.contactSettings.create({
      data: {}
    })
  }

  return settings
})
