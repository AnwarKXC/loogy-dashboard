import prisma from '../../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order ID'
    })
  }

  const orderId = parseInt(id, 10)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              translations: true
            }
          }
        }
      }
    }
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found'
    })
  }

  // Transform order for public consumption
  const transformedOrder = {
    id: order.id,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingCity: order.shippingCity,
    shippingStreet: order.shippingStreet,
    subtotal: Number(order.subtotal),
    discount: order.discount ? Number(order.discount) : null,
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => {
      // Get product name from translations
      const arName = item.product?.translations?.find(t => t.lang === 'AR')?.name
      const enName = item.product?.translations?.find(t => t.lang === 'EN')?.name
      const productName = {
        ar: arName || enName || `Product ${item.productId}`,
        en: enName || arName || `Product ${item.productId}`
      }

      return {
        id: item.id,
        productName,
        quantity: item.quantity,
        price: Number(item.price),
        totalPrice: Number(item.totalPrice)
      }
    })
  }

  return transformedOrder
})
