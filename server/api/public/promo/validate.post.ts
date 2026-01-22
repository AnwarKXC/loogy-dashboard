import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '../../../db'

/**
 * Public endpoint to validate and apply a promo code.
 * Returns discount information if valid.
 */

const validatePromoSchema = z.object({
  code: z.string().trim().min(1, 'Promo code is required').transform(val => val.toUpperCase()),
  subtotal: z.number().min(0).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = validatePromoSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request'
    })
  }

  const { code, subtotal = 0 } = result.data
  const now = new Date()

  // Find the promo code
  const promoCode = await prisma.pricePromoCode.findUnique({
    where: { code }
  })

  if (!promoCode) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid promo code'
    })
  }

  // Check if active
  if (!promoCode.isActive) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Promo code is not active'
    })
  }

  // Check validity dates
  if (promoCode.validFrom && promoCode.validFrom > now) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Promo code is not yet valid'
    })
  }

  if (promoCode.validTo && promoCode.validTo < now) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Promo code has expired'
    })
  }

  // Check usage limit
  if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Promo code usage limit has been reached'
    })
  }

  // Calculate discount
  let discountAmount = 0
  const value = Number(promoCode.value)

  if (promoCode.applicationType === 'PERCENTAGE') {
    discountAmount = (subtotal * value) / 100
  } else {
    discountAmount = Math.min(value, subtotal) // Don't exceed subtotal
  }

  return {
    valid: true,
    code: promoCode.code,
    applicationType: promoCode.applicationType,
    value: value,
    discountAmount: Math.round(discountAmount * 100) / 100,
    message: promoCode.applicationType === 'PERCENTAGE'
      ? `${value}% discount applied`
      : `${value} EGP discount applied`
  }
})
