import { eventHandler } from 'h3'

import prisma from '../../db'
import { getProductInclude, mapProductToListItem } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'
import { readCartCookie } from '../../utils/storefront-session'

export default eventHandler(async (event) => {
  const cart = readCartCookie(event)

  if (cart.items.length === 0) {
    return { items: [], subtotal: 0 }
  }

  const productIds = cart.items.map((item) => item.productId)

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: getProductInclude()
  })

  const mapped = new Map(
    (products as unknown as ProductWithRelations[]).map(product => [product.id, mapProductToListItem(product)])
  )

  const items = cart.items
    .map((item) => {
      const product = mapped.get(item.productId)
      if (!product) return null

      const price = product.salePrice ?? product.price

      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        name: product.name,
        slug: product.slug,
        price,
        salePrice: product.salePrice,
        image: product.image,
        availabilityType: product.availabilityType,
        expectedArrivalDate: product.expectedArrivalDate,
        isArchived: product.isArchived
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    // Filter out archived products from cart
    .filter(item => !item.isArchived)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    items,
    subtotal
  }
})
