// DELETE /api/superadmin/shipping/zones/[id] - Delete a shipping zone
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../db'

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

    // First, unlink all governorates from this zone
    await prisma.governorate.updateMany({
      where: { shippingZoneId: zoneId },
      data: { shippingZoneId: null }
    })

    // Delete the zone
    await prisma.shippingZone.delete({
      where: { id: zoneId }
    })

    return { success: true, message: 'Shipping zone deleted successfully' }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error deleting shipping zone:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete shipping zone'
    })
  }
})
