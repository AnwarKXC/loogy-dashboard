// GET /api/shipping/governorates/[id]/areas - Get areas for a specific governorate
import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import prisma from '../../../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const lang = (query.lang as string) || 'en'

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Governorate ID is required'
    })
  }

  try {
    const governorateId = parseInt(id, 10)

    if (isNaN(governorateId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid governorate ID'
      })
    }

    // First check if governorate exists
    const governorate = await prisma.governorate.findUnique({
      where: { id: governorateId },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        slug: true
      }
    })

    if (!governorate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Governorate not found'
      })
    }

    // Get areas for this governorate
    const areas = await prisma.area.findMany({
      where: {
        governorateId,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    })

    return {
      governorate: {
        id: governorate.id,
        slug: governorate.slug,
        name: lang === 'ar' ? governorate.nameAr : governorate.nameEn,
        nameEn: governorate.nameEn,
        nameAr: governorate.nameAr
      },
      areas: areas.map(area => ({
        id: area.id,
        slug: area.slug,
        name: lang === 'ar' ? area.nameAr : area.nameEn,
        nameEn: area.nameEn,
        nameAr: area.nameAr
      }))
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error fetching areas:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch areas'
    })
  }
})
