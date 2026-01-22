import { z } from 'zod'
import prisma from '../../../db'

const BodySchema = z.object({
  productId: z.number(),
  orderId: z.number().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().max(2000).optional(),
  customerName: z.string().max(100).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, BodySchema.parse)

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: body.productId }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  // If orderId is provided, verify it's a valid delivered order with this product
  let isVerified = false
  if (body.orderId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: body.orderId,
        productId: body.productId
      },
      include: {
        order: true
      }
    })

    if (orderItem && orderItem.order.status === 'DELIVERED') {
      isVerified = true
    }
  }

  // Create the review (pending moderation)
  const review = await prisma.productReview.create({
    data: {
      productId: body.productId,
      orderId: body.orderId,
      rating: body.rating,
      title: body.title,
      content: body.content,
      customerName: body.customerName,
      isVerified,
      status: 'PENDING'
    }
  })

  return {
    success: true,
    message: 'Review submitted successfully. It will be visible after moderation.',
    reviewId: review.id
  }
})
