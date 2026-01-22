import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)

  const review = await prisma.productReview.findUnique({
    where: { id },
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

  if (!review) {
    throw createError({
      statusCode: 404,
      message: 'Review not found'
    })
  }

  return {
    ...review,
    productName: review.product.translations[0]?.name ?? review.product.slug,
    productImage: review.product.images[0] ?? null
  }
})
