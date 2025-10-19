import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '../../../app/generated/prisma'
import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString, getProductInclude, mapProductToListItem } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'

type FilterEntity = {
  id: number
  name: unknown
  slug: string
}

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  sort: z.enum(['newest', 'oldest', 'price-asc', 'price-desc', 'stock-asc', 'stock-desc']).catch('newest'),
  includeFilters: z.coerce.boolean().catch(false),
  includeArchived: z.coerce.boolean().catch(false)
})

type SortKey = z.infer<typeof querySchema>['sort']

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))

  const whereClauses: Prisma.ProductWhereInput[] = []

  if (!query.includeArchived) {
    whereClauses.push({ isArchived: false } as Prisma.ProductWhereInput)
  }

  if (query.search) {
    whereClauses.push({
      OR: [
        { slug: { contains: query.search, mode: 'insensitive' } },
        { name: { path: ['en'], string_contains: query.search, mode: 'insensitive' } },
        { name: { path: ['ar'], string_contains: query.search, mode: 'insensitive' } }
      ]
    })
  }

  if (query.categoryId) {
    whereClauses.push({ categoryId: query.categoryId })
  }

  if (query.brandId) {
    whereClauses.push({ brandId: query.brandId })
  }

  const where: Prisma.ProductWhereInput = whereClauses.length ? { AND: whereClauses } : {}

  const orderByMap: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
    'newest': [{ createdAt: 'desc' }],
    'oldest': [{ createdAt: 'asc' }],
    'price-asc': [{ price: 'asc' }],
    'price-desc': [{ price: 'desc' }],
    'stock-asc': [{ stock: 'asc' }, { quantity: 'asc' }],
    'stock-desc': [{ stock: 'desc' }, { quantity: 'desc' }]
  }

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const shouldIncludeFilters = query.includeFilters

  const productQuery = prisma.product.findMany({
    where,
    include: getProductInclude(),
    orderBy: orderByMap[query.sort],
    skip,
    take
  })

  let totalItems: number
  let products: Awaited<typeof productQuery>
  let categories: FilterEntity[] = []
  let brands: FilterEntity[] = []

  if (shouldIncludeFilters) {
    ;[totalItems, products, categories, brands] = await prisma.$transaction([
      prisma.product.count({ where }),
      productQuery,
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true
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
  } else {
    ;[totalItems, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      productQuery
    ])
  }

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = (products as unknown as ProductWithRelations[]).map(mapProductToListItem)

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    },
    filters: shouldIncludeFilters
      ? {
          categories: (categories as FilterEntity[]).map(category => ({
            id: category.id,
            name: getLocalizedString(category.name),
            slug: category.slug
          })),
          brands: (brands as FilterEntity[]).map(brand => ({
            id: brand.id,
            name: getLocalizedString(brand.name),
            slug: brand.slug
          }))
        }
      : undefined
  }
})
