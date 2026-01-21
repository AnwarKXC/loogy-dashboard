import { eventHandler, readBody, createError, setResponseStatus } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { readWishlistCookie, writeWishlistCookie } from '../../utils/storefront-session'

const payloadSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional()
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

  const wishlist = readWishlistCookie(event)
  const exists = wishlist.items.some(item => item.productId === payload.productId && item.variantId === payload.variantId)

  if (!exists) {
    wishlist.items.push({
      productId: payload.productId,
      variantId: payload.variantId
    })
  }

  writeWishlistCookie(event, wishlist)
  setResponseStatus(event, 201)

  return { success: true }
})
