import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '../../../db'

/**
 * Public guest checkout endpoint for Cash on Delivery orders.
 * No authentication required.
 */

const guestOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
    governorate: z.string().optional(),
    address: z.string().min(1, 'العنوان مطلوب'),
    notes: z.string().optional()
  }),
  paymentMethod: z.enum(['cod']).default('cod'),
  items: z.array(z.object({
    productId: z.number(),
    variantId: z.number().optional().nullable(),
    title: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
    image: z.string().optional()
  })).min(1, 'السلة فارغة')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = guestOrderSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'بيانات غير صحيحة',
      data: result.error.flatten()
    })
  }

  const { customer, items } = result.data

  // Calculate totals and verify stock
  let subtotal = 0
  const orderItemsData: Array<{
    productId: number
    variantId: number | null
    quantity: number
    price: number
    totalPrice: number
  }> = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    })

    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `المنتج "${item.title}" غير موجود`
      })
    }

    if (product.stock < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `المنتج "${item.title}" غير متوفر بالكمية المطلوبة`
      })
    }

    const totalPrice = item.price * item.quantity
    subtotal += totalPrice

    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      price: item.price,
      totalPrice
    })
  }

  const shippingCost = 80 // Fixed shipping cost
  const totalAmount = subtotal + shippingCost

  // Create guest order
  const order = await prisma.order.create({
    data: {
      customerName: customer.name,
      shippingPhone: customer.phone,
      shippingStreet: `${customer.address}${customer.notes ? ` (${customer.notes})` : ''}`,
      shippingCity: customer.governorate || 'مصر',
      shippingCountry: 'EG',
      paymentMethod: 'CASH',
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
        stock: { decrement: item.quantity }
      }
    })
  }

  return {
    success: true,
    orderId: order.id,
    orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
    message: 'تم إنشاء الطلب بنجاح. سنتواصل معك قريباً لتأكيد الشحن.'
  }
})
