import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const BodySchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  storeDescription: z.string().max(1000).nullable().optional(),
  currency: z.string().min(1).max(10).optional(),
  languageOptions: z.array(z.string()).optional(),
  defaultLanguage: z.string().min(2).max(5).optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readValidatedBody(event, BodySchema.parse)

  // Get or create singleton, then update
  let settings = await prisma.appSettings.findFirst()

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        storeName: body.storeName ?? 'My Store',
        storeDescription: body.storeDescription ?? null,
        currency: body.currency ?? 'EGP',
        languageOptions: body.languageOptions ?? ['en', 'ar'],
        defaultLanguage: body.defaultLanguage ?? 'ar'
      }
    })
  } else {
    settings = await prisma.appSettings.update({
      where: { id: settings.id },
      data: body
    })
  }

  return settings
})
