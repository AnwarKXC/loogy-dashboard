import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '../../app/generated/prisma'
import { prisma } from '../utils/prisma'
import { requireSuperAdmin } from '../utils/superadmin-session'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  sort: z.enum(['newest', 'oldest', 'name-asc', 'name-desc', 'orders-desc']).catch('newest')
})

type SortKey = z.infer<typeof querySchema>['sort']

const orderByMap: Record<SortKey, Prisma.UserOrderByWithRelationInput[]> = {
  'newest': [{ createdAt: 'desc' }],
  'oldest': [{ createdAt: 'asc' }],
  'name-asc': [{ name: 'asc' }],
  'name-desc': [{ name: 'desc' }],
  'orders-desc': [{ orders: { _count: 'desc' } }, { createdAt: 'desc' }]
}

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))

  const whereClauses: Prisma.UserWhereInput[] = [{ role: 'CUSTOMER' }]

  if (query.status) {
    whereClauses.push({ isActive: query.status === 'ACTIVE' })
  }

  if (query.search) {
    const term = query.search
    whereClauses.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phoneNumber: { contains: term, mode: 'insensitive' } }
      ]
    })
  }

  const where: Prisma.UserWhereInput = { AND: whereClauses }

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [totalItems, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: orderByMap[query.sort],
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      },
      skip,
      take
    })
  ])

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    status: user.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
    ordersCount: user._count.orders,
    lastSession: user.lastSession.toISOString(),
    createdAt: user.createdAt.toISOString()
  }))

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
