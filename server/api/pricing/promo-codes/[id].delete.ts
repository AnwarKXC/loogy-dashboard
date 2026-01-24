import { eventHandler, getRouterParam, createError, setResponseStatus } from 'h3'
import { z } from 'zod'

import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default eventHandler(async (event) => {
  // Only OWNER can delete promo codes
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const params = paramsSchema.parse({ id: getRouterParam(event, 'id') })

  const existing = await prisma.pricePromoCode.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Promo code not found'
    })
  }

  await prisma.pricePromoCode.delete({
    where: { id: params.id }
  })

  setResponseStatus(event, 200)

  return {
    success: true,
    message: `Promo code "${existing.code}" has been deleted`
  }
})
