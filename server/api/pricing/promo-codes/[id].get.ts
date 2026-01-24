import { eventHandler, getRouterParam, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const params = paramsSchema.parse({ id: getRouterParam(event, 'id') })

  const promoCode = await prisma.pricePromoCode.findUnique({
    where: { id: params.id },
    include: {
      applicableProducts: {
        select: { id: true }
      }
    }
  })

  if (!promoCode) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Promo code not found'
    })
  }

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
      scope: promoCode.scope,
      applicableAvailabilityTypes: promoCode.applicableAvailabilityTypes,
      applicableProductIds: promoCode.applicableProducts.map(p => p.id),
      status,
      createdAt: promoCode.createdAt.toISOString(),
      updatedAt: promoCode.updatedAt.toISOString()
    }
  }
})
