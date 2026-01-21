import { eventHandler, readBody } from 'h3'
import { z } from 'zod'

import { readCartCookie, writeCartCookie } from '../../utils/storefront-session'

const payloadSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional()
})

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const payload = payloadSchema.parse(body)

  const cart = readCartCookie(event)
  cart.items = cart.items.filter(item => item.productId !== payload.productId || item.variantId !== payload.variantId)

  writeCartCookie(event, cart)

  return { success: true }
})
