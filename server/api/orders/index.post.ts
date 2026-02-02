import { defineEventHandler, readBody, createError, getRequestURL } from 'h3'
import { z } from 'zod'
import prisma from '../../db'
import { sendOrderNotification, sendCustomerOrderConfirmation } from '../../utils/whatsapp'

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
  const orderItemsData: Array<{
    productId: number
    variantId: number | null
    quantity: number
    price: number
    totalPrice: number
  }> = []
  // Store product names separately for notifications (not stored in DB)
  const productNamesMap = new Map<number, string>()

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
    productNamesMap.set(item.productId, productName)
    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      price,
      totalPrice
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

  // Send WhatsApp notification to business (async, don't block response)
  const baseUrl = getRequestURL(event).origin
  sendOrderNotification({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingCity: order.shippingCity,
    shippingStreet: order.shippingStreet,
    totalAmount: Number(order.totalAmount),
    items: order.items.map(item => ({
      productName: productNamesMap.get(item.productId) || `Product ${item.productId}`,
      quantity: item.quantity,
      price: Number(item.price)
    })),
    notes: order.notes
  }, baseUrl).catch((err) => {
    console.error('Failed to send WhatsApp order notification:', err)
  })

  // Send WhatsApp confirmation to customer (async, don't block response)
  sendCustomerOrderConfirmation({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingCity: order.shippingCity,
    shippingStreet: order.shippingStreet,
    totalAmount: Number(order.totalAmount),
    items: order.items.map(item => ({
      productName: productNamesMap.get(item.productId) || `Product ${item.productId}`,
      quantity: item.quantity,
      price: Number(item.price)
    }))
  }, baseUrl).catch((err) => {
    console.error('Failed to send WhatsApp customer confirmation:', err)
  })

  return {
    success: true,
    order
  }
})
