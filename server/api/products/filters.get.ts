import { eventHandler } from 'h3'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../../utils/products'
import { buildCategoryTree } from '../../utils/categories'
import type { CategoryRecord } from '../../utils/categories'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const [categories, brands] = await prisma.$transaction([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        createdAt: true,
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
        name: true,
        slug: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  ])

  const categoryTree = buildCategoryTree(
    categories as unknown as CategoryRecord[],
    false,
    (value, slug) => getLocalizedString(value) || slug
  )

  return {
    categories: categoryTree,
    brands: brands.map(brand => ({
      id: brand.id,
      name: getLocalizedString(brand.name),
      slug: brand.slug
    }))
  }
})
