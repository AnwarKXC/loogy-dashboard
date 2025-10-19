import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '~/generated/prisma'
import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { mapBrandRecord } from '../../utils/brands'
import type { BrandRecord } from '../../utils/brands'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(['newest', 'oldest', 'name-asc', 'name-desc']).catch('newest')
})

type SortKey = z.infer<typeof querySchema>['sort']

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))
  const whereClauses: Record<string, unknown>[] = []

  if (query.search) {
    const searchTerm = query.search

    whereClauses.push({
      OR: [
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { name: { path: ['en'], string_contains: searchTerm, mode: 'insensitive' } },
        { name: { path: ['ar'], string_contains: searchTerm, mode: 'insensitive' } }
      ]
    })
  }

  const where = whereClauses.length > 0 ? { AND: whereClauses } : {}

  const orderByMap: Record<SortKey, Prisma.BrandOrderByWithRelationInput[]> = {
    'newest': [{ createdAt: 'desc' }],
    'oldest': [{ createdAt: 'asc' }],
    'name-asc': [{ slug: 'asc' }],
    'name-desc': [{ slug: 'desc' }]
  }

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [totalItems, records] = await prisma.$transaction([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy: orderByMap[query.sort],
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      skip,
      take
    })
  ])

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = (records as BrandRecord[]).map(record => mapBrandRecord(record, getLocalizedString))

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
