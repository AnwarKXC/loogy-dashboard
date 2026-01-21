import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { readCartCookie, writeCartCookie } from '../../utils/storefront-session'

const payloadSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().min(1)
})

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const payload = payloadSchema.parse(body)

  const product = await prisma.product.findFirst({
    where: {
      id: payload.productId,
      isArchived: false,
      isPublished: true
    },
    select: { id: true }
  })

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const cart = readCartCookie(event)
  const target = cart.items.find(item => item.productId === payload.productId && item.variantId === payload.variantId)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })
  }

  target.quantity = payload.quantity
  writeCartCookie(event, cart)

  return { success: true }
})
