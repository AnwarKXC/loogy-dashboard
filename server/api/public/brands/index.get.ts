import { eventHandler } from 'h3'

import prisma from '../../../db'
import { getLocalizedString } from '../../../utils/products'

export default eventHandler(async () => {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: [{ createdAt: 'asc' }]
  })

  return {
    brands: brands.map(brand => ({
      id: brand.id,
      name: getLocalizedString(brand.name),
      slug: brand.slug,
      productCount: brand._count.products
    }))
  }
})
