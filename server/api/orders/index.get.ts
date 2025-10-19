import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '../../../app/generated/prisma'
import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { mapOrderToList, getOrderInclude } from './utils'
import type { OrderWithRelations } from './utils'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['PENDING', 'SHIPPING', 'DELIVERED']).optional(),
  paymentMethod: z.enum(['CASH', 'VODAFONE_CASH', 'INSTAPAY', 'VISA']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z.enum(['newest', 'oldest', 'total-asc', 'total-desc']).catch('newest')
})

type SortKey = z.infer<typeof querySchema>['sort']

const orderByMap: Record<SortKey, Prisma.OrderOrderByWithRelationInput[]> = {
  'newest': [{ createdAt: 'desc' }],
  'oldest': [{ createdAt: 'asc' }],
  'total-asc': [{ totalAmount: 'asc' }],
  'total-desc': [{ totalAmount: 'desc' }]
}

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))

  const whereClauses: Prisma.OrderWhereInput[] = []

  if (query.status) {
    whereClauses.push({ status: query.status })
  }

  if (query.paymentMethod) {
    whereClauses.push({ paymentMethod: query.paymentMethod })
  }

  if (query.search) {
    const searchTerm = query.search
    whereClauses.push({
      OR: [
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { shippingPhone: { contains: searchTerm, mode: 'insensitive' } },
        { shippingWhatsapp: { contains: searchTerm, mode: 'insensitive' } }
      ]
    })
  }

  if (query.dateFrom || query.dateTo) {
    whereClauses.push({
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined
      }
    })
  }

  const where = whereClauses.length > 0 ? { AND: whereClauses } : {}

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [totalItems, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: orderByMap[query.sort],
      include: getOrderInclude(),
      skip,
      take
    })
  ])

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = (orders as unknown as OrderWithRelations[]).map(mapOrderToList)

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
