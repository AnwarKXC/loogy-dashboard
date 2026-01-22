import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const BodySchema = z.object({
  isEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxName: z.string().min(1).max(50).optional(),
  taxNumber: z.string().max(50).nullable().optional(),
  includedInPrice: z.boolean().optional(),
  applyToShipping: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER'] })

  const body = await readValidatedBody(event, BodySchema.parse)

  // Get or create singleton, then update
  let settings = await prisma.taxSettings.findFirst()

  if (!settings) {
    settings = await prisma.taxSettings.create({
      data: {
        isEnabled: body.isEnabled ?? false,
        taxRate: body.taxRate ?? 0,
        taxName: body.taxName ?? 'VAT',
        taxNumber: body.taxNumber ?? null,
        includedInPrice: body.includedInPrice ?? true,
        applyToShipping: body.applyToShipping ?? false
      }
    })
  } else {
    settings = await prisma.taxSettings.update({
      where: { id: settings.id },
      data: body
    })
  }

  return {
    ...settings,
    taxRate: settings.taxRate.toNumber()
  }
})
