import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

import type { ProductReview } from '@prisma/client'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  productId: z.coerce.number().optional(),
  search: z.string().optional()
})

type ReviewWithProduct = ProductReview & {
  product: {
    id: number
    slug: string
    images: string[]
    translations: { name: string | null }[]
  }
}

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { page, limit, status, productId, search } = query

  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (productId) {
    where.productId = productId
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            images: true,
            translations: {
              where: { lang: 'AR' },
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.productReview.count({ where })
  ])

  return {
    reviews: reviews.map((r: ReviewWithProduct) => ({
      ...r,
      productName: r.product.translations[0]?.name ?? r.product.slug,
      productImage: r.product.images[0] ?? null
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
})
