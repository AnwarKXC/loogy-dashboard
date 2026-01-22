import { eventHandler, readBody, getRouterParam, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const updatePromoCodeSchema = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be 50 characters or fewer')
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform(val => val.toUpperCase())
    .optional(),
  applicationType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.coerce.number().positive('Value must be greater than 0').optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validTo: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional()
}).refine((data) => {
  // Percentage must be between 0 and 100
  if (data.applicationType === 'PERCENTAGE' && data.value && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['value']
}).refine((data) => {
  // validTo must be after validFrom if both are provided
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

  const params = paramsSchema.parse({ id: getRouterParam(event, 'id') })
  const body = await readBody(event)
  const payload = updatePromoCodeSchema.parse(body)

  // Check if promo code exists
  const existing = await prisma.pricePromoCode.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Promo code not found'
    })
  }

  // Check if new code already exists (if changing code)
  if (payload.code && payload.code !== existing.code) {
    const codeExists = await prisma.pricePromoCode.findUnique({
      where: { code: payload.code }
    })

    if (codeExists) {
      throw createError({
        statusCode: 409,
        statusMessage: `Promo code "${payload.code}" already exists`
      })
    }
  }

  // Validate percentage if updating applicationType or value
  const finalType = payload.applicationType ?? existing.applicationType
  const finalValue = payload.value ?? Number(existing.value)
  if (finalType === 'PERCENTAGE' && finalValue > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Percentage discount cannot exceed 100%'
    })
  }

  const promoCode = await prisma.pricePromoCode.update({
    where: { id: params.id },
    data: {
      code: payload.code ?? existing.code,
      applicationType: payload.applicationType ?? existing.applicationType,
      value: payload.value ?? existing.value,
      validFrom: payload.validFrom !== undefined ? payload.validFrom : existing.validFrom,
      validTo: payload.validTo !== undefined ? payload.validTo : existing.validTo,
      usageLimit: payload.usageLimit !== undefined ? payload.usageLimit : existing.usageLimit,
      isActive: payload.isActive ?? existing.isActive
    }
  })

  const now = new Date()
  let status: 'active' | 'inactive' | 'expired' = 'active'
  if (!promoCode.isActive) {
    status = 'inactive'
  } else if (promoCode.validTo && promoCode.validTo < now) {
    status = 'expired'
  }

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
      status,
      createdAt: promoCode.createdAt.toISOString(),
      updatedAt: promoCode.updatedAt.toISOString()
    }
  }
})
