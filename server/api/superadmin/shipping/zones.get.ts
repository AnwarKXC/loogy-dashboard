// GET /api/superadmin/shipping/zones - Get all shipping zones with governorates
import { createError, defineEventHandler } from 'h3'
import prisma from '../../../db'

export default defineEventHandler(async () => {
  try {
    const zones = await prisma.shippingZone.findMany({
      include: {
        governorates: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            slug: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return {
      zones: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        price: Number(zone.price),
        freeShippingThreshold: zone.freeShippingThreshold
          ? Number(zone.freeShippingThreshold)
          : null,
        estimatedDays: zone.estimatedDays,
        isActive: zone.isActive,
        displayOrder: zone.displayOrder,
        governorates: zone.governorates,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt
      }))
    }
  } catch (error) {
    console.error('Error fetching shipping zones:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch shipping zones'
    })
  }
})
