import { eventHandler } from 'h3'
import prisma from '../../db'

/**
 * Minimal products list endpoint for dropdowns/selectors.
 * Returns only id, slug, and names (EN/AR) for all published products.
 * Designed for client-side filtering.
 */
export default eventHandler(async () => {
  const products = await prisma.product.findMany({
    where: {
      isArchived: false,
      isPublished: true,
      deletedAt: null
    },
    select: {
      id: true,
      slug: true,
      translations: {
        select: {
          lang: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return products.map((p) => {
    const nameEn = p.translations.find(t => t.lang === 'EN')?.name || p.slug
    const nameAr = p.translations.find(t => t.lang === 'AR')?.name || nameEn
    return {
      id: p.id,
      slug: p.slug,
      nameEn,
      nameAr
    }
  })
})
