import { defineEventHandler } from 'h3'
import prisma from '../../db'

export default defineEventHandler(async () => {
  // Fetch all published products with translations for SEO data
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      isArchived: false,
      deletedAt: null
    },
    select: {
      slug: true,
      updatedAt: true,
      images: true,
      translations: {
        where: { lang: 'AR' },
        select: {
          name: true,
          metaTitle: true,
          metaDescription: true
        },
        take: 1
      }
    }
  })

  return products.map((product) => {
    const translation = product.translations[0]
    return {
      loc: `/products/${product.slug}`,
      lastmod: product.updatedAt,
      changefreq: 'weekly' as const,
      priority: 0.8,
      images: product.images?.length
        ? product.images.slice(0, 3).map(img => ({
            loc: img,
            title: translation?.metaTitle || translation?.name || product.slug
          }))
        : undefined
    }
  })
})
