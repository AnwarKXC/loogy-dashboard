import { eventHandler } from 'h3'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString, getPreferredTranslation } from '../../utils/products'
import { buildCategoryTree } from '../../utils/categories'
import type { CategoryRecord } from '../../utils/categories'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const [categories, brands] = await prisma.$transaction([
    prisma.category.findMany({
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
      orderBy: {
        createdAt: 'asc'
      }
    }),
    prisma.brand.findMany({
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
      orderBy: {
        createdAt: 'asc'
      }
    })
  ])

  const normalizedCategories = categories.map(category => ({
    ...category,
    name: Object.fromEntries(
      category.translations.map(translation => [translation.lang.toLowerCase(), translation.name])
    )
  }))

  const categoryTree = buildCategoryTree(
    normalizedCategories as unknown as CategoryRecord[],
    false,
    (value, slug) => getLocalizedString(value) || slug
  )

  return {
    categories: categoryTree,
    brands: brands.map(brand => ({
      id: brand.id,
      name: getPreferredTranslation(brand.translations, 'name'),
      slug: brand.slug,
      translations: brand.translations
    }))
  }
})
