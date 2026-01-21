import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '@prisma/client'
import prisma from '../../../db'
import { getProductInclude, mapProductToListItem } from '../../../utils/products'
import type { ProductWithRelations } from '../../../utils/products'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
  search: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().trim().min(1).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  brandSlug: z.string().trim().min(1).optional(),
  sale: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc', 'rating']).catch('featured')
})

type SortKey = z.infer<typeof querySchema>['sort']

export default eventHandler(async (event) => {
  const query = querySchema.parse(getQuery(event))

  const whereClauses: Prisma.ProductWhereInput[] = [
    { isArchived: false },
    { isPublished: true }
  ]

  if (query.search) {
    whereClauses.push({
      OR: [
        { slug: { contains: query.search, mode: 'insensitive' } },
        { translations: { some: { name: { contains: query.search, mode: 'insensitive' } } } }
      ]
    })
  }

  if (query.categoryId) {
    whereClauses.push({ categoryId: query.categoryId })
  }

  if (query.categorySlug) {
    whereClauses.push({ category: { slug: query.categorySlug } })
  }

  if (query.brandId) {
    whereClauses.push({ brandId: query.brandId })
  }

  if (query.brandSlug) {
    whereClauses.push({ brand: { slug: query.brandSlug } })
  }

  if (query.sale === 'true') {
    whereClauses.push({ NOT: { salePrice: null } })
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const price: Prisma.DecimalFilter = {}
    if (query.minPrice !== undefined) {
      price.gte = query.minPrice
    }
    if (query.maxPrice !== undefined) {
      price.lte = query.maxPrice
    }
    whereClauses.push({ price })
  }

  const where: Prisma.ProductWhereInput = { AND: whereClauses }

  const orderByMap: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
    'featured': [{ createdAt: 'desc' }],
    'newest': [{ createdAt: 'desc' }],
    'price-asc': [{ price: 'asc' }],
    'price-desc': [{ price: 'desc' }],
    'rating': [{ createdAt: 'desc' }]
  }

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [totalItems, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: getProductInclude(),
      orderBy: orderByMap[query.sort],
      skip,
      take
    })
  ])

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = (products as unknown as ProductWithRelations[]).map(mapProductToListItem)

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  }
})
