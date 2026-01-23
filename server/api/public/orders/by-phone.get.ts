import { defineEventHandler, getQuery, createError } from 'h3'
import prisma from '../../../db'

/**
 * Public endpoint to get all orders for a phone number.
 * Used for guest order tracking without login.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = query.phone as string

  if (!phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone number is required'
    })
  }

  // Validate Egyptian phone format
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  const egyptPhoneRegex = /^(\+20|0)(10|11|12|15)\d{8}$/
  
  if (!egyptPhoneRegex.test(cleanPhone)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid phone number format'
    })
  }

  // Normalize phone for search - search both formats
  const searchPatterns: string[] = []

  if (cleanPhone.startsWith('+20')) {
    searchPatterns.push(cleanPhone)
    searchPatterns.push('0' + cleanPhone.slice(3))
  } else if (cleanPhone.startsWith('0')) {
    searchPatterns.push(cleanPhone)
    searchPatterns.push('+2' + cleanPhone)
  } else {
    searchPatterns.push(cleanPhone)
  }

  // Fetch all orders for this phone number
  const orders = await prisma.order.findMany({
    where: {
      customerPhone: { in: searchPatterns }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      status: true,
      subtotal: true,
      discount: true,
      shippingCost: true,
      totalAmount: true,
      paymentMethod: true,
      createdAt: true,
      updatedAt: true,
      shippingStreet: true,
      shippingCity: true,
      governorate: {
        select: {
          id: true,
          nameEn: true,
          nameAr: true
        }
      },
      area: {
        select: {
          id: true,
          nameEn: true,
          nameAr: true
        }
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              slug: true,
              images: true,
              translations: {
                select: {
                  lang: true,
                  name: true
                }
              }
            }
          }
        }
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          note: true,
          createdAt: true
        }
      }
    }
  })

  // Get customer info from the most recent order
  const latestOrder = orders[0]
  const customer = latestOrder ? {
    name: latestOrder.customerName,
    phone: latestOrder.customerPhone,
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  } : null

  return {
    found: orders.length > 0,
    customer,
    orders: orders.map(order => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingStreet: order.shippingStreet,
      shippingCity: order.shippingCity,
      governorate: order.governorate,
      area: order.area,
      timeline: order.timeline,
      subtotal: Number(order.subtotal),
      discount: order.discount ? Number(order.discount) : null,
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item: typeof order.items[number]) => ({
        ...item,
        price: Number(item.price),
        totalPrice: Number(item.totalPrice)
      }))
    }))
  }
})
