import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '../../../db'

/**
 * Public guest checkout endpoint for Cash on Delivery orders.
 * No authentication required.
 * Supports promo codes and dynamic pricing settings.
 */

const guestOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Invalid phone number'),
    governorate: z.string().optional(),
    governorateId: z.number().nullable().optional(),
    areaId: z.number().nullable().optional(),
    address: z.string().min(1, 'Address is required'),
    whatsapp: z.string().optional()
  }),
  paymentMethod: z.enum(['cod']).default('cod'),
  items: z.array(z.object({
    productId: z.number(),
    variantId: z.number().optional().nullable(),
    title: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
    image: z.string().optional()
  })).min(1, 'Cart is empty'),
  promoCode: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = guestOrderSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid data',
      data: result.error.flatten()
    })
  }

  const { customer, items, promoCode } = result.data

  // Get pricing settings
  let pricingSettings = await prisma.pricingSettings.findFirst({
    orderBy: { id: 'asc' }
  })

  if (!pricingSettings) {
    pricingSettings = await prisma.pricingSettings.create({
      data: {
        shippingFee: 50,
        minOrderValue: 0,
        maxOrderValue: null,
        bulkDiscountThreshold: null,
        bulkDiscountPercentage: null
      }
    })
  }

  // Calculate totals and verify stock
  let subtotal = 0
  const orderItemsData: Array<{
    productId: number
    variantId: number | null
    quantity: number
    price: number
    totalPrice: number
  }> = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    })

    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product "${item.title}" not found`
      })
    }

    if (product.stock < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product "${item.title}" is not available in the requested quantity`
      })
    }

    const totalPrice = item.price * item.quantity
    subtotal += totalPrice

    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      price: item.price,
      totalPrice
    })
  }

  // Validate min/max order values
  const minOrderValue = pricingSettings.minOrderValue ? Number(pricingSettings.minOrderValue) : 0
  const maxOrderValue = pricingSettings.maxOrderValue ? Number(pricingSettings.maxOrderValue) : null

  if (subtotal < minOrderValue) {
    throw createError({
      statusCode: 400,
      statusMessage: `Minimum order value is ${minOrderValue} EGP`
    })
  }

  if (maxOrderValue && subtotal > maxOrderValue) {
    throw createError({
      statusCode: 400,
      statusMessage: `Maximum order value is ${maxOrderValue} EGP`
    })
  }

  // Calculate bulk discount
  let bulkDiscount = 0
  const bulkThreshold = pricingSettings.bulkDiscountThreshold ? Number(pricingSettings.bulkDiscountThreshold) : null
  const bulkPercentage = pricingSettings.bulkDiscountPercentage ? Number(pricingSettings.bulkDiscountPercentage) : null

  if (bulkThreshold && bulkPercentage && subtotal >= bulkThreshold) {
    bulkDiscount = (subtotal * bulkPercentage) / 100
  }

  // Validate and apply promo code
  let promoDiscount = 0
  let appliedPromoId: number | null = null

  if (promoCode) {
    const now = new Date()
    const promo = await prisma.pricePromoCode.findUnique({
      where: { code: promoCode.toUpperCase() }
    })

    if (promo && promo.isActive) {
      // Check validity dates
      const validFrom = !promo.validFrom || promo.validFrom <= now
      const validTo = !promo.validTo || promo.validTo >= now
      const hasUsage = !promo.usageLimit || promo.usageCount < promo.usageLimit

      if (validFrom && validTo && hasUsage) {
        const promoValue = Number(promo.value)
        if (promo.applicationType === 'PERCENTAGE') {
          promoDiscount = (subtotal * promoValue) / 100
        } else {
          promoDiscount = Math.min(promoValue, subtotal)
        }
        appliedPromoId = promo.id
      }
    }
  }

  // Calculate final totals
  const totalDiscount = bulkDiscount + promoDiscount
  const shippingCost = pricingSettings.shippingFee ? Number(pricingSettings.shippingFee) : 0
  const totalAmount = Math.max(0, subtotal - totalDiscount + shippingCost)

  // Create guest order
  const order = await prisma.order.create({
    data: {
      customerName: customer.name,
      customerPhone: customer.phone,
      shippingPhone: customer.phone,
      shippingStreet: customer.address,
      shippingCity: customer.governorate || 'Egypt',
      shippingCountry: 'EG',
      governorateId: customer.governorateId ?? null,
      areaId: customer.areaId ?? null,
      notes: customer.whatsapp ? `WhatsApp: ${customer.whatsapp}` : null,
      paymentMethod: 'CASH',
      subtotal,
      discount: totalDiscount > 0 ? totalDiscount : null,
      shippingCost,
      totalAmount,
      items: {
        create: orderItemsData
      }
    },
    include: {
      items: true
    }
  })

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity }
      }
    })
  }

  // Increment promo code usage if applied
  if (appliedPromoId) {
    await prisma.pricePromoCode.update({
      where: { id: appliedPromoId },
      data: { usageCount: { increment: 1 } }
    })
  }

  return {
    success: true,
    orderId: order.id,
    orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
    message: 'Order created successfully. We will contact you soon to confirm shipping.',
    summary: {
      subtotal,
      discount: totalDiscount,
      shipping: shippingCost,
      total: totalAmount
    }
  }
})
