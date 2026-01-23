import { z } from 'zod'
import prisma from '../../../db'
import { readCartCookie, writeCartCookie } from '../../../utils/storefront-session'

const bodySchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().positive().default(1)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { slug, quantity } = bodySchema.parse(body)

  // Find product by slug
  const product = await prisma.product.findFirst({
    where: {
      slug,
      isArchived: false
    },
    select: {
      id: true,
      slug: true
    }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: `Product not found: ${slug}`
    })
  }

  // Read current cart
  const cart = readCartCookie(event)

  // Check if item already exists
  const existingIndex = cart.items.findIndex(
    item => item.productId === product.id && !item.variantId
  )

  if (existingIndex >= 0) {
    // Update quantity
    cart.items[existingIndex].quantity += quantity
  }
  else {
    // Add new item
    cart.items.push({
      productId: product.id,
      quantity
    })
  }

  // Write updated cart
  writeCartCookie(event, cart)

  return { success: true, itemsCount: cart.items.length }
})
