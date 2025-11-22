import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '../../db'
import { notifyAdmins } from '../../utils/web-push'
import { getIO } from '../../sockets/chat.gateway'

const createOrderSchema = z.object({
  userId: z.number().optional(),
  customerName: z.string().min(1),
  shippingPhone: z.string().min(1),
  shippingStreet: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingCountry: z.string().min(1),
  paymentMethod: z.enum(['CASH', 'VODAFONE_CASH', 'INSTAPAY', 'VISA']),
  items: z.array(z.object({
    productId: z.number(),
    variantId: z.number().optional(),
    quantity: z.number().min(1)
  })).min(1)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createOrderSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.flatten()
    })
  }

  const { items, ...orderData } = result.data

  // Calculate totals and verify stock
  let subtotal = 0
  const orderItemsData = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    })

    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product with ID ${item.productId} not found`
      })
    }

    // Check stock (simplified)
    if (product.quantity < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Insufficient stock for product ${product.name}`
      })
    }

    const price = Number(product.price)
    const totalPrice = price * item.quantity
    subtotal += totalPrice

    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price,
      totalPrice,
      productName: (product.name ?? Prisma.JsonNull) as Prisma.InputJsonValue
    })
  }

  const shippingCost = 50 // Fixed shipping cost for now
  const totalAmount = subtotal + shippingCost

  // Create order
  const order = await prisma.order.create({
    data: {
      ...orderData,
      subtotal,
      shippingCost,
      totalAmount,
      items: {
        create: orderItemsData
      }
    },
    include: {
      items: true
    }
  })

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: { decrement: item.quantity }
      }
    })
  }

  // Notify admins
  await notifyAdmins(
    'New Order Received',
    `Order #${order.id} from ${order.customerName} - ${totalAmount} EGP`,
    `/orders/${order.id}`
  )

  // Emit WebSocket event
  const io = getIO()
  if (io) {
    io.to('admin-room').emit('order:new', {
      id: order.id,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    })
  }

  return {
    success: true,
    order
  }
})
