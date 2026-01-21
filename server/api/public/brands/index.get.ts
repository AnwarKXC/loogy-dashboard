import { eventHandler } from 'h3'

import prisma from '../../../db'
import { getLocalizedString } from '../../../utils/products'

export default eventHandler(async () => {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      slug: true,
      logo: true,
      translations: {
        select: {
          lang: true,
          name: true
        }
      },
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
      name: getLocalizedString(brand.translations) || brand.slug,
      slug: brand.slug,
      logo: brand.logo ?? null,
      productCount: brand._count.products
    }))
  }
})
