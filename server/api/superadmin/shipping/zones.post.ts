// POST /api/superadmin/shipping/zones - Create a new shipping zone
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../db'
import { z } from 'zod'

const createZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  price: z.number().min(0, 'Price must be positive'),
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  estimatedDays: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  governorateIds: z.array(z.number()).optional().default([])
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validated = createZoneSchema.parse(body)

    // Get max display order
    const maxOrder = await prisma.shippingZone.aggregate({
      _max: { displayOrder: true }
    })
    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    // Create the zone
    const zone = await prisma.shippingZone.create({
      data: {
        name: validated.name,
        price: validated.price,
        freeShippingThreshold: validated.freeShippingThreshold ?? null,
        estimatedDays: validated.estimatedDays ?? null,
        isActive: validated.isActive,
        displayOrder: nextOrder
      }
    })

    // Assign governorates to this zone
    if (validated.governorateIds.length > 0) {
      await prisma.governorate.updateMany({
        where: { id: { in: validated.governorateIds } },
        data: { shippingZoneId: zone.id }
      })
    }

    // Fetch the zone with governorates
    const result = await prisma.shippingZone.findUnique({
      where: { id: zone.id },
      include: {
        governorates: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            slug: true
          }
        }
      }
    })

    return {
      zone: {
        id: result!.id,
        name: result!.name,
        price: Number(result!.price),
        freeShippingThreshold: result!.freeShippingThreshold
          ? Number(result!.freeShippingThreshold)
          : null,
        estimatedDays: result!.estimatedDays,
        isActive: result!.isActive,
        displayOrder: result!.displayOrder,
        governorates: result!.governorates
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || 'Validation error'
      })
    }
    console.error('Error creating shipping zone:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create shipping zone'
    })
  }
})
