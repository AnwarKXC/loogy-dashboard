import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const BodySchema = z.object({
  phoneNumber: z.string().max(20).nullable().optional(),
  vodafoneCashNumber: z.string().max(20).nullable().optional(),
  instaPayUrl: z.string().url().nullable().optional(),
  instaPayQrCode: z.string().nullable().optional(),
  instaPayNumber: z.string().max(50).nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readValidatedBody(event, BodySchema.parse)

  // Get or create singleton, then update
  let settings = await prisma.contactSettings.findFirst()

  if (!settings) {
    settings = await prisma.contactSettings.create({
      data: body
    })
  } else {
    settings = await prisma.contactSettings.update({
      where: { id: settings.id },
      data: body
    })
  }

  return settings
})
