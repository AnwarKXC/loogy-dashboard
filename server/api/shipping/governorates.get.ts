// GET /api/shipping/governorates - Get all governorates with shipping info
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '../../db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lang = (query.lang as string) || 'en'

  try {
    const governorates = await prisma.governorate.findMany({
      where: { isActive: true },
      include: {
        shippingZone: {
          select: {
            id: true,
            name: true,
            price: true,
            freeShippingThreshold: true,
            estimatedDays: true
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return {
      governorates: governorates.map(gov => ({
        id: gov.id,
        slug: gov.slug,
        name: lang === 'ar' ? gov.nameAr : gov.nameEn,
        nameEn: gov.nameEn,
        nameAr: gov.nameAr,
        shippingPrice: gov.shippingZone?.price ? Number(gov.shippingZone.price) : null,
        shippingZone: gov.shippingZone
          ? {
              id: gov.shippingZone.id,
              name: gov.shippingZone.name,
              price: Number(gov.shippingZone.price),
              freeShippingThreshold: gov.shippingZone.freeShippingThreshold
                ? Number(gov.shippingZone.freeShippingThreshold)
                : null,
              estimatedDays: gov.shippingZone.estimatedDays
            }
          : null
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
