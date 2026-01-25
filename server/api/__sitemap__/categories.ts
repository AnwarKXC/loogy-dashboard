import { defineEventHandler } from 'h3'
import prisma from '../../db'

export default defineEventHandler(async () => {
  // Fetch all categories with translations
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null
    },
    select: {
      slug: true,
      updatedAt: true,
      translations: {
        where: { lang: 'AR' },
        select: {
          name: true,
          ogImage: true
        },
        take: 1
      }
    }
  })

  return categories.map((category) => {
    const translation = category.translations[0]
    return {
      loc: `/categories/${category.slug}`,
      lastmod: category.updatedAt,
      changefreq: 'weekly' as const,
      priority: 0.7,
      images: translation?.ogImage
        ? [{
            loc: translation.ogImage,
            title: translation.name || category.slug
          }]
        : undefined
    }
  })
})
