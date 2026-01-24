import { eventHandler, readBody, setResponseStatus, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const createPromoCodeSchema = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be 50 characters or fewer')
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform(val => val.toUpperCase()),
  applicationType: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive('Value must be greater than 0'),
  validFrom: z.coerce.date().optional().nullable(),
  validTo: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
  scope: z.enum(['GLOBAL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_PRODUCT_TYPES']).default('GLOBAL'),
  applicableAvailabilityTypes: z.array(z.enum(['IN_STOCK_EGYPT', 'ARRIVING_SOON', 'PRE_ORDER'])).optional().default([]),
  applicableProductIds: z.array(z.number().int().positive()).optional().default([])
}).refine((data) => {
  // Percentage must be between 0 and 100
  if (data.applicationType === 'PERCENTAGE' && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['value']
}).refine((data) => {
  // validTo must be after validFrom
  if (data.validFrom && data.validTo) {
    return data.validTo > data.validFrom
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['validTo']
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readBody(event)
  const payload = createPromoCodeSchema.parse(body)

  // Check if code already exists
  const existing = await prisma.pricePromoCode.findUnique({
    where: { code: payload.code }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: `Promo code "${payload.code}" already exists`
    })
  }

  // Get pricing settings ID (optional relation)
  const pricingSettings = await prisma.pricingSettings.findFirst({
    orderBy: { id: 'asc' }
  })

  const promoCode = await prisma.pricePromoCode.create({
    data: {
      code: payload.code,
      applicationType: payload.applicationType,
      value: payload.value,
      validFrom: payload.validFrom ?? null,
      validTo: payload.validTo ?? null,
      usageLimit: payload.usageLimit ?? null,
      isActive: payload.isActive,
      pricingSettingsId: pricingSettings?.id ?? null,
      scope: payload.scope,
      applicableAvailabilityTypes: payload.applicableAvailabilityTypes ?? [],
      applicableProducts: payload.applicableProductIds?.length
        ? { connect: payload.applicableProductIds.map(id => ({ id })) }
        : undefined
    },
    include: {
      applicableProducts: {
        select: { id: true }
      }
    }
  })

  setResponseStatus(event, 201)

  return {
    promoCode: {
      id: promoCode.id,
      code: promoCode.code,
      applicationType: promoCode.applicationType,
      value: promoCode.value.toString(),
      validFrom: promoCode.validFrom?.toISOString() ?? null,
      validTo: promoCode.validTo?.toISOString() ?? null,
      usageLimit: promoCode.usageLimit,
      usageCount: promoCode.usageCount,
      isActive: promoCode.isActive,
      scope: promoCode.scope,
      applicableAvailabilityTypes: promoCode.applicableAvailabilityTypes,
      applicableProductIds: promoCode.applicableProducts.map(p => p.id),
      createdAt: promoCode.createdAt.toISOString(),
      updatedAt: promoCode.updatedAt.toISOString()
    }
  }
})
