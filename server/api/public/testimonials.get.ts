import { z } from 'zod'
import prisma from '../../db'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  source: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { page, limit, source } = query

  const where: Record<string, unknown> = {
    isPublished: true
  }

  if (source) {
    where.source = source
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        content: true,
        images: true,
        source: true,
        rating: true,
        createdAt: true
      },
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
