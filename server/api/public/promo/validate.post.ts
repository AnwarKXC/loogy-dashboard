import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '../../../db'

/**
 * Public endpoint to validate and apply a promo code.
 * Returns discount information if valid.
 */

const validatePromoSchema = z.object({
  code: z.string().trim().min(1, 'Promo code is required').transform(val => val.toUpperCase()),
  subtotal: z.number().min(0).optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number(),
    price: z.number()
  })).optional()
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

  const { code, subtotal = 0, items = [] } = result.data
  const now = new Date()

  // Find the promo code
  const promoCode = await prisma.pricePromoCode.findUnique({
    where: { code },
    include: {
      applicableProducts: {
        select: { id: true }
      }
    }
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
  
  // If global logic (default)
  if (promoCode.scope === 'GLOBAL') {
    const value = Number(promoCode.value)
    if (promoCode.applicationType === 'PERCENTAGE') {
      discountAmount = (subtotal * value) / 100
    } else {
      discountAmount = Math.min(value, subtotal)
    }
  } else {
    // Restricted scope logic
    if (!items.length) {
      // If we need to validate items but none provided, we can't apply strictly
      // But maybe we fallback to 0 or error? 
      // Let's assume passed subtotal matches items if they were passed. 
      // But we need items to verify eligibility.
      throw createError({
        statusCode: 400,
        statusMessage: 'Items required for this promo code'
      })
    }

    // Fetch product details to check type
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, availabilityType: true }
    })
    
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Filter eligible items
    let eligibleSubtotal = 0
    let hasEligibleItems = false

    const applicableProductIds = new Set(promoCode.applicableProducts.map(p => p.id))
    
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue

      let isEligible = false
      
      if (promoCode.scope === 'SPECIFIC_PRODUCTS') {
        if (applicableProductIds.has(product.id)) {
          isEligible = true
        }
      } else if (promoCode.scope === 'SPECIFIC_PRODUCT_TYPES') {
        if (promoCode.applicableAvailabilityTypes.includes(product.availabilityType)) {
          isEligible = true
        }
      }

      if (isEligible) {
        eligibleSubtotal += item.price * item.quantity
        hasEligibleItems = true
      }
    }

    if (!hasEligibleItems) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Promo code not applicable to items in cart'
      })
    }

    const value = Number(promoCode.value)
    if (promoCode.applicationType === 'PERCENTAGE') {
      // Apply percentage to eligible subtotal
      discountAmount = (eligibleSubtotal * value) / 100
    } else {
      // Fixed amount: Apply once if eligible items exist
      // Cap at eligible subtotal? Or total subtotal?
      // Usually capped at total order value, but logic suggests we only discount what we promoted.
      // But for fixed, it's often "Get $10 off if you buy X". The $10 comes off the total.
      // Let's cap at subtotal to be safe.
      discountAmount = Math.min(value, subtotal)
    }
  }

  const value = Number(promoCode.value)

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
