import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const BodySchema = z.object({
  facebookGroup: z.string().url().nullable().optional(),
  facebookPage: z.string().url().nullable().optional(),
  instagramPage: z.string().url().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readValidatedBody(event, BodySchema.parse)

  // Get or create singleton, then update
  let settings = await prisma.socialSettings.findFirst()

  if (!settings) {
    settings = await prisma.socialSettings.create({
      data: body
    })
  } else {
    settings = await prisma.socialSettings.update({
      where: { id: settings.id },
      data: body
    })
  }

  return settings
})
