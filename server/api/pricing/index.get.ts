import { eventHandler } from 'h3'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  // Get or create pricing settings (singleton pattern)
  let settings = await prisma.pricingSettings.findFirst({
    orderBy: { id: 'asc' }
  })

  if (!settings) {
    settings = await prisma.pricingSettings.create({
      data: {
        shippingFee: 50,
        minOrderValue: 0,
        maxOrderValue: null,
        bulkDiscountThreshold: null,
        bulkDiscountPercentage: null,
        currency: 'EGP'
      }
    })
  }

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
