import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

const BodySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  adminNote: z.string().max(1000).nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)
  const body = await readValidatedBody(event, BodySchema.parse)

  const existing = await prisma.productReview.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Review not found'
    })
  }

  const review = await prisma.productReview.update({
    where: { id },
    data: body,
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
    }
  })

  // If status changed to APPROVED, update product rating
  if (body.status === 'APPROVED') {
    await updateProductRating(review.productId)
  }

  return {
    ...review,
    productName: review.product.translations[0]?.name ?? review.product.slug,
    productImage: review.product.images[0] ?? null
  }
})

async function updateProductRating(productId: number) {
  const result = await prisma.productReview.aggregate({
    where: {
      productId,
      status: 'APPROVED'
    },
    _avg: {
      rating: true
    }
  })

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: result._avg.rating ?? null
    }
  })
}
