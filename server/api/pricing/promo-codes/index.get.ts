import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '@prisma/client'
import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['all', 'active', 'inactive', 'expired']).catch('all'),
  sort: z.enum(['newest', 'oldest', 'code-asc', 'code-desc', 'usage']).catch('newest')
})

type SortKey = z.infer<typeof querySchema>['sort']

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))
  const whereClauses: Prisma.PricePromoCodeWhereInput[] = []
  const now = new Date()

  if (query.search) {
    whereClauses.push({
      code: { contains: query.search, mode: 'insensitive' }
    })
  }

  // Filter by status
  if (query.status === 'active') {
    whereClauses.push({
      isActive: true,
      OR: [
        { validTo: null },
        { validTo: { gte: now } }
      ]
    })
  } else if (query.status === 'inactive') {
    whereClauses.push({ isActive: false })
  } else if (query.status === 'expired') {
    whereClauses.push({
      validTo: { lt: now }
    })
  }

  const where: Prisma.PricePromoCodeWhereInput = whereClauses.length > 0 ? { AND: whereClauses } : {}

  const orderByMap: Record<SortKey, Prisma.PricePromoCodeOrderByWithRelationInput[]> = {
    'newest': [{ createdAt: 'desc' }],
    'oldest': [{ createdAt: 'asc' }],
    'code-asc': [{ code: 'asc' }],
    'code-desc': [{ code: 'desc' }],
    'usage': [{ usageCount: 'desc' }]
  }

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [totalItems, records] = await prisma.$transaction([
    prisma.pricePromoCode.count({ where }),
    prisma.pricePromoCode.findMany({
      where,
      orderBy: orderByMap[query.sort],
      skip,
      take
    })
  ])

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = records.map((record) => {
    // Determine status
    let status: 'active' | 'inactive' | 'expired' = 'active'
    if (!record.isActive) {
      status = 'inactive'
    } else if (record.validTo && record.validTo < now) {
      status = 'expired'
    }

    return {
      id: record.id,
      code: record.code,
      applicationType: record.applicationType,
      value: record.value.toString(),
      validFrom: record.validFrom?.toISOString() ?? null,
      validTo: record.validTo?.toISOString() ?? null,
      usageLimit: record.usageLimit,
      usageCount: record.usageCount,
      isActive: record.isActive,
      status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    }
  })

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
