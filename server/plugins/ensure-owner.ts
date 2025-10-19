import { prisma } from '../utils/prisma'
import { hashPassword } from '../utils/superadmin-session'

export default async function ensureOwnerPlugin() {
  const ownerEmail = process.env.SUPERADMIN_OWNER_EMAIL?.trim()
  const ownerPassword = process.env.SUPERADMIN_OWNER_PASSWORD
  const ownerName = process.env.SUPERADMIN_OWNER_NAME?.trim() || 'Owner'

  if (!ownerEmail || !ownerPassword) {
    if (import.meta.dev) {
      console.warn('[superadmin] SUPERADMIN_OWNER_EMAIL or SUPERADMIN_OWNER_PASSWORD is missing; default owner seeding skipped.')
    }
    return
  }

  const normalizedEmail = ownerEmail.toLowerCase()

  const existingOwner = await prisma.superAdmin.findFirst({
    where: { role: 'OWNER' }
  })

  if (existingOwner) {
    return
  }

  const existingAccount = await prisma.superAdmin.findUnique({
    where: { email: normalizedEmail }
  })

  const passwordHash = await hashPassword(ownerPassword)

  if (existingAccount) {
    await prisma.superAdmin.update({
      where: { id: existingAccount.id },
      data: {
        name: ownerName,
        role: 'OWNER',
        passwordHash,
        createdById: null
      }
    })
    return
  }

  await prisma.superAdmin.create({
    data: {
      email: normalizedEmail,
      name: ownerName,
      role: 'OWNER',
      passwordHash
    }
  })
}
