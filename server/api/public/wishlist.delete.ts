import { eventHandler, readBody } from 'h3'
import { z } from 'zod'

import { readWishlistCookie, writeWishlistCookie } from '../../utils/storefront-session'

const payloadSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional()
})

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const payload = payloadSchema.parse(body)

  const wishlist = readWishlistCookie(event)
  wishlist.items = wishlist.items.filter(item => item.productId !== payload.productId || item.variantId !== payload.variantId)

  writeWishlistCookie(event, wishlist)

  return { success: true }
})
