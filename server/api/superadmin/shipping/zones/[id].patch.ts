// PATCH /api/superadmin/shipping/zones/[id] - Update a shipping zone
import { createError, defineEventHandler, readBody, getRouterParam } from 'h3'
import prisma from '../../../../db'
import { z } from 'zod'

const updateZoneSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  estimatedDays: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  governorateIds: z.array(z.number()).optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Zone ID is required'
    })
  }

  const zoneId = parseInt(id, 10)
  if (isNaN(zoneId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid zone ID'
    })
  }

  try {
    const body = await readBody(event)
    const validated = updateZoneSchema.parse(body)

    // Check if zone exists
    const existing = await prisma.shippingZone.findUnique({
      where: { id: zoneId }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Shipping zone not found'
      })
    }

    // Update the zone
    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.price !== undefined) updateData.price = validated.price
    if (validated.freeShippingThreshold !== undefined) {
      updateData.freeShippingThreshold = validated.freeShippingThreshold
    }
    if (validated.estimatedDays !== undefined) {
      updateData.estimatedDays = validated.estimatedDays
    }
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    await prisma.shippingZone.update({
      where: { id: zoneId },
      data: updateData
    })

    // Handle governorate assignments if provided
    if (validated.governorateIds !== undefined) {
      // First, remove this zone from all governorates that currently have it
      await prisma.governorate.updateMany({
        where: { shippingZoneId: zoneId },
        data: { shippingZoneId: null }
      })

      // Then assign the new governorates to this zone
      if (validated.governorateIds.length > 0) {
        await prisma.governorate.updateMany({
          where: { id: { in: validated.governorateIds } },
          data: { shippingZoneId: zoneId }
        })
      }
    }

    // Fetch the updated zone with governorates
    const result = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
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
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.errors[0]?.message || 'Validation error'
      })
    }
    console.error('Error updating shipping zone:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update shipping zone'
    })
  }
})
