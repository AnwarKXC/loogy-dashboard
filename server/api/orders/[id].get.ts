import { eventHandler, createError } from 'h3'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getOrderInclude, mapOrderToDetail } from './utils'
import type { OrderWithRelations } from './utils'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const idParam = event.context.params?.id
  const orderId = Number(idParam)

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: getOrderInclude()
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  return {
    order: mapOrderToDetail(order as unknown as OrderWithRelations)
  }
})
