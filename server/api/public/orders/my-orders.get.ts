import prisma from '../../../db'
import { verifyAuthToken } from '../../../utils/otp'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Authentication token required'
    })
  }

  // Verify token and get phone
  const authResult = await verifyAuthToken(token)

  if (!authResult.valid || !authResult.phone) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token. Please verify your phone again.'
    })
  }

  const phone = authResult.phone

  // Format phone variations for lookup
  const phoneVariations = [
    phone,
    phone.startsWith('20') ? '0' + phone.slice(2) : phone,
    phone.startsWith('0') ? '20' + phone.slice(1) : phone,
    '+' + phone,
    '+20' + (phone.startsWith('20') ? phone.slice(2) : phone.startsWith('0') ? phone.slice(1) : phone)
  ]

  // Fetch orders for this phone
  const orders = await prisma.order.findMany({
    where: {
      customerPhone: { in: phoneVariations }
    },
    include: {
      governorate: {
        select: { id: true, nameEn: true, nameAr: true }
      },
      area: {
        select: { id: true, nameEn: true, nameAr: true }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              images: true,
              translations: {
                select: { lang: true, name: true }
              }
            }
          }
        }
      },
      timeline: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get customer info from most recent order
  const firstOrder = orders[0]
  const customer = firstOrder ? {
    name: firstOrder.customerName,
    phone: firstOrder.customerPhone,
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  } : null

  return {
    found: orders.length > 0,
    phone: authResult.phone,
    customer,
    orders: orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      discount: order.discount ? Number(order.discount) : null,
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        totalPrice: Number(item.totalPrice)
      }))
    }))
  }
})
