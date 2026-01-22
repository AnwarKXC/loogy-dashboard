import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  source: z.string().optional(),
  isPublished: z.enum(['true', 'false']).optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { page, limit, source, isPublished } = query

  const where: Record<string, unknown> = {}

  if (source) {
    where.source = source
  }

  if (isPublished !== undefined) {
    where.isPublished = isPublished === 'true'
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.testimonial.count({ where })
  ])

  return {
    testimonials,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
})
