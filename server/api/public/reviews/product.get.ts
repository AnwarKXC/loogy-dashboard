import { z } from 'zod'
import prisma from '../../../db'

const QuerySchema = z.object({
  productId: z.coerce.number(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { productId, page, limit } = query

  const [reviews, total, stats] = await Promise.all([
    prisma.productReview.findMany({
      where: {
        productId,
        status: 'APPROVED'
      },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        customerName: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.productReview.count({
      where: {
        productId,
        status: 'APPROVED'
      }
    }),
    prisma.productReview.aggregate({
      where: {
        productId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })
  ])

  // Get rating distribution
  const distribution = await prisma.productReview.groupBy({
    by: ['rating'],
    where: {
      productId,
      status: 'APPROVED'
    },
    _count: {
      rating: true
    }
  })

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  distribution.forEach((d: { rating: number, _count: { rating: number } }) => {
    ratingDistribution[d.rating] = d._count.rating
  })

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
      distribution: ratingDistribution
    }
  }
})
