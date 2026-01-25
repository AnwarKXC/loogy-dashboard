import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '../../db'

const createOrderSchema = z.object({
  customerPhone: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  shippingPhone: z.string().min(1),
  shippingStreet: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingCountry: z.string().default('Egypt'),
  governorateId: z.number().optional(),
  areaId: z.number().optional(),
  paymentMethod: z.enum(['CASH', 'VODAFONE_CASH', 'INSTAPAY', 'VISA']),
  promoCode: z.string().optional(),
  notes: z.string().optional(),
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
      where: { id: item.productId },
      include: {
        translations: {
          select: { lang: true, name: true }
        }
      }
    })

    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product with ID ${item.productId} not found`
      })
    }

    // Check stock (simplified)
    if (product.stock < item.quantity) {
      const productName = product.translations.find(t => t.name)?.name || `Product ${product.id}`
      throw createError({
        statusCode: 400,
        statusMessage: `Insufficient stock for product ${productName}`
      })
    }

    const price = Number(product.price)
    const totalPrice = price * item.quantity
    subtotal += totalPrice

    const productName = product.translations.find(t => t.name)?.name || `Product ${product.id}`
    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price,
      totalPrice,
      productName: (productName ?? Prisma.JsonNull) as Prisma.InputJsonValue
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
        stock: { decrement: item.quantity }
      }
    })
  }

  return {
    success: true,
    order
  }
})
