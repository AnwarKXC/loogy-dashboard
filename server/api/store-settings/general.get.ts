import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const QuerySchema = z.object({
  id: z.coerce.number().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = await getValidatedQuery(event, QuerySchema.parse)

  // Get or create singleton settings
  let settings = await prisma.appSettings.findFirst({
    where: query.id ? { id: query.id } : undefined
  })

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        storeName: 'My Store',
        storeDescription: null,
        currency: 'EGP',
        languageOptions: ['en', 'ar'],
        defaultLanguage: 'ar'
      }
    })
  }

  return settings
})
