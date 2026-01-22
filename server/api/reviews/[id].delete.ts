import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)

  const existing = await prisma.productReview.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Review not found'
    })
  }

  const productId = existing.productId

  await prisma.productReview.delete({
    where: { id }
  })

  // Update product rating after deletion
  await updateProductRating(productId)

  return { success: true }
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
