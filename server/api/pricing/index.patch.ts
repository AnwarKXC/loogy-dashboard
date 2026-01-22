import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const updatePricingSchema = z.object({
  shippingFee: z.coerce.number().min(0).optional().nullable(),
  minOrderValue: z.coerce.number().min(0).optional().nullable(),
  maxOrderValue: z.coerce.number().min(0).optional().nullable(),
  bulkDiscountThreshold: z.coerce.number().min(0).optional().nullable(),
  bulkDiscountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  currency: z.string().min(1).max(10).optional()
}).refine((data) => {
  // If both min and max are set, max must be greater than min
  if (data.minOrderValue != null && data.maxOrderValue != null) {
    return data.maxOrderValue >= data.minOrderValue
  }
  return true
}, {
  message: 'Maximum order value must be greater than or equal to minimum order value',
  path: ['maxOrderValue']
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER'] })

  const body = await readBody(event)
  const payload = updatePricingSchema.parse(body)

  // Get existing settings
  const existing = await prisma.pricingSettings.findFirst({
    orderBy: { id: 'asc' }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pricing settings not found. Please refresh the page.'
    })
  }

  const settings = await prisma.pricingSettings.update({
    where: { id: existing.id },
    data: {
      shippingFee: payload.shippingFee ?? existing.shippingFee,
      minOrderValue: payload.minOrderValue ?? existing.minOrderValue,
      maxOrderValue: payload.maxOrderValue,
      bulkDiscountThreshold: payload.bulkDiscountThreshold,
      bulkDiscountPercentage: payload.bulkDiscountPercentage,
      currency: payload.currency ?? existing.currency
    }
  })

  return {
    settings: {
      id: settings.id,
      shippingFee: settings.shippingFee?.toString() ?? null,
      minOrderValue: settings.minOrderValue?.toString() ?? null,
      maxOrderValue: settings.maxOrderValue?.toString() ?? null,
      bulkDiscountThreshold: settings.bulkDiscountThreshold?.toString() ?? null,
      bulkDiscountPercentage: settings.bulkDiscountPercentage?.toString() ?? null,
      currency: settings.currency,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString()
    }
  }
})
