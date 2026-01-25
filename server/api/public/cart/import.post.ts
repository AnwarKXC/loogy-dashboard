import { z } from 'zod'
import prisma from '../../../db'
import { readCartCookie, writeCartCookie } from '../../../utils/storefront-session'

const bodySchema = z.object({
  items: z.array(z.object({
    slug: z.string().min(1),
    quantity: z.number().int().positive().default(1)
  })).min(1)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { items } = bodySchema.parse(body)

  // Get all slugs to look up
  const slugs = items.map(item => item.slug)

  // Find all products by slugs in one query
  const products = await prisma.product.findMany({
    where: {
      slug: { in: slugs },
      isArchived: false
    },
    select: {
      id: true,
      slug: true
    }
  })

  // Create a map for quick lookup
  const productMap = new Map(products.map(p => [p.slug, p.id]))

  // Read current cart
  const cart = readCartCookie(event)

  // Track added items
  let addedCount = 0
  const notFound: string[] = []

  for (const item of items) {
    const productId = productMap.get(item.slug)

    if (!productId) {
      notFound.push(item.slug)
      continue
    }

    // Check if item already exists
    const existingIndex = cart.items.findIndex(
      cartItem => cartItem.productId === productId && !cartItem.variantId
    )

    if (existingIndex >= 0 && cart.items[existingIndex]) {
      // Update quantity
      cart.items[existingIndex].quantity += item.quantity
    }
    else {
      // Add new item
      cart.items.push({
        productId,
        quantity: item.quantity
      })
    }
    addedCount++
  }

  // Write updated cart
  writeCartCookie(event, cart)

  return {
    success: true,
    addedCount,
    notFound,
    totalItems: cart.items.length
  }
})
