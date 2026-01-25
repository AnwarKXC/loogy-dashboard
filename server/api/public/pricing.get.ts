import { defineEventHandler } from 'h3'
import prisma from '../../db'

/**
 * Public endpoint to get pricing settings for checkout.
 * Returns shipping fee, min/max order values, bulk discount info.
 */

export default defineEventHandler(async () => {
  // Get pricing settings (singleton)
  let settings = await prisma.pricingSettings.findFirst({
    orderBy: { id: 'asc' }
  })

  // Create default if not exists
  if (!settings) {
    settings = await prisma.pricingSettings.create({
      data: {
        shippingFee: 50,
        minOrderValue: 0,
        maxOrderValue: null,
        bulkDiscountThreshold: null,
        bulkDiscountPercentage: null
      }
    })
  }

  return {
    shippingFee: settings.shippingFee ? Number(settings.shippingFee) : 0,
    minOrderValue: settings.minOrderValue ? Number(settings.minOrderValue) : 0,
    maxOrderValue: settings.maxOrderValue ? Number(settings.maxOrderValue) : null,
    bulkDiscountThreshold: settings.bulkDiscountThreshold ? Number(settings.bulkDiscountThreshold) : null,
    bulkDiscountPercentage: settings.bulkDiscountPercentage ? Number(settings.bulkDiscountPercentage) : null,
    currency: 'EGP'
  }
})
