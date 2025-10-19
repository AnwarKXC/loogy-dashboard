import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getOrderInclude, mapOrderToDetail } from './utils'
import type { OrderWithRelations } from './utils'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'SHIPPING', 'DELIVERED']).optional(),
  paymentMethod: z.enum(['CASH', 'VODAFONE_CASH', 'INSTAPAY', 'VISA']).optional(),
  shippingPhone: z.string().trim().optional(),
  shippingWhatsapp: z.string().trim().optional().nullable(),
  shippingStreet: z.string().trim().optional(),
  shippingCity: z.string().trim().optional(),
  shippingCountry: z.string().trim().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Provide at least one field to update'
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const idParam = event.context.params?.id
  const orderId = Number(idParam)

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }

  const body = await readBody(event)
  const payload = updateOrderSchema.parse(body)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: getOrderInclude()
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: payload.status ?? order.status,
      paymentMethod: payload.paymentMethod ?? order.paymentMethod,
      shippingPhone: payload.shippingPhone ?? order.shippingPhone,
      shippingWhatsapp: payload.shippingWhatsapp !== undefined ? payload.shippingWhatsapp : order.shippingWhatsapp,
      shippingStreet: payload.shippingStreet ?? order.shippingStreet,
      shippingCity: payload.shippingCity ?? order.shippingCity,
      shippingCountry: payload.shippingCountry ?? order.shippingCountry
    },
    include: getOrderInclude()
  })

  return {
    order: mapOrderToDetail(updated as unknown as OrderWithRelations)
  }
})
