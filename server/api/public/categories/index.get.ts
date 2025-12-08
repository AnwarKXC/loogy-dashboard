import { eventHandler } from 'h3'

import prisma from '../../../db'
import { getLocalizedString } from '../../../utils/products'
import { buildCategoryTree } from '../../../utils/categories'
import type { CategoryRecord } from '../../../utils/categories'

export default eventHandler(async () => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      parentId: true,
      createdAt: true,
      translations: {
        select: {
          lang: true,
          name: true
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

  const normalized = categories.map(category => ({
    id: category.id,
    slug: category.slug,
    parentId: category.parentId,
    createdAt: category.createdAt,
    _count: category._count,
    name: Object.fromEntries(
      category.translations.map(translation => [translation.lang.toLowerCase(), translation.name])
    )
  }))

  const tree = buildCategoryTree(
    normalized as unknown as CategoryRecord[],
    true,
    (value, slug) => getLocalizedString(value) || slug
  )

  return {
    categories: tree
  }
})
