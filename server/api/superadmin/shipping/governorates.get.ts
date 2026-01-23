// GET /api/superadmin/shipping/governorates - Get all governorates for admin management
import { createError, defineEventHandler } from 'h3'
import prisma from '../../../db'

export default defineEventHandler(async () => {
  try {
    const governorates = await prisma.governorate.findMany({
      include: {
        shippingZone: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        _count: {
          select: { areas: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return {
      governorates: governorates.map(gov => ({
        id: gov.id,
        slug: gov.slug,
        nameEn: gov.nameEn,
        nameAr: gov.nameAr,
        isActive: gov.isActive,
        displayOrder: gov.displayOrder,
        shippingZoneId: gov.shippingZoneId,
        shippingZone: gov.shippingZone
          ? {
              id: gov.shippingZone.id,
              name: gov.shippingZone.name,
              price: Number(gov.shippingZone.price)
            }
          : null,
        areasCount: gov._count.areas
      }))
    }
  } catch (error) {
    console.error('Error fetching governorates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch governorates'
    })
  }
})
