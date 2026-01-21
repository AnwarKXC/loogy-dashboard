import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { buildCategoryTree } from '../../utils/categories'
import type { CategoryRecord } from '../../utils/categories'

const querySchema = z.object({
  includeProductCounts: z.coerce.boolean().catch(true)
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      parentId: true,
      createdAt: true,
      translations: {
        select: {
          lang: true,
          name: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          metaKeywords: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true
        }
      },
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    },
    orderBy: [{ createdAt: 'asc' }]
  })

  // Transform to the expected format
  const normalized = categories.map((category) => {
    const enTranslation = category.translations.find(t => t.lang === 'EN')
    const arTranslation = category.translations.find(t => t.lang === 'AR')

    return {
      id: category.id,
      slug: category.slug,
      parentId: category.parentId,
      createdAt: category.createdAt,
      _count: category._count,
      name: {
        en: enTranslation?.name ?? category.slug,
        ar: arTranslation?.name ?? ''
      },
      translations: category.translations
    }
  })

  const tree = buildCategoryTree(
    normalized as unknown as CategoryRecord[],
    query.includeProductCounts,
    (value, slug) => {
      if (typeof value === 'object' && value !== null) {
        return (value as Record<string, string>).en || slug
      }
      return slug
    }
  )

  return {
    categories: tree
  }
})
