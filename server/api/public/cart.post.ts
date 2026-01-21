import { eventHandler, readBody, createError, setResponseStatus } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { readCartCookie, writeCartCookie } from '../../utils/storefront-session'

const payloadSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive().catch(1)
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
  const existing = cart.items.find(item => item.productId === payload.productId && item.variantId === payload.variantId)

  if (existing) {
    existing.quantity += payload.quantity
  } else {
    cart.items.push({
      productId: payload.productId,
      variantId: payload.variantId,
      quantity: payload.quantity
    })
  }

  writeCartCookie(event, cart)
  setResponseStatus(event, 201)

  return { success: true }
})
