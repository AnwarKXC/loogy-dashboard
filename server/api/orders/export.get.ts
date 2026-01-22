import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const QuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(10000).default(1000)
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { format, status, fromDate, toDate, limit } = query

  // Build where clause
  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(fromDate)
    }
    if (toDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(toDate)
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              translations: {
                where: { lang: 'AR' },
                select: { name: true }
              }
            }
          }
        }
      },
      user: {
        select: {
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  // Map orders for export
  const exportData = orders.map((order) => {
    const itemsText = order.items.map((item) => {
      const productName = item.product.translations[0]?.name ?? item.product.slug
      return `${productName} x${item.quantity}`
    }).join('; ')

    return {
      orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
      status: order.status,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerEmail: order.user?.email ?? '',
      customerPhone: order.shippingPhone,
      shippingStreet: order.shippingStreet,
      shippingCity: order.shippingCity,
      shippingCountry: order.shippingCountry,
      items: itemsText,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: order.subtotal.toNumber(),
      discount: order.discount?.toNumber() ?? 0,
      shippingCost: order.shippingCost.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }
  })

  if (format === 'json') {
    return {
      orders: exportData,
      total: exportData.length,
      exportedAt: new Date().toISOString()
    }
  }

  // Generate CSV
  const headers = [
    'Order Number',
    'Status',
    'Payment Method',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Shipping Street',
    'Shipping City',
    'Shipping Country',
    'Items',
    'Item Count',
    'Subtotal',
    'Discount',
    'Shipping Cost',
    'Total Amount',
    'Created At',
    'Updated At'
  ]

  const csvRows = [
    headers.join(','),
    ...exportData.map(order => [
      `"${order.orderNumber}"`,
      `"${order.status}"`,
      `"${order.paymentMethod}"`,
      `"${order.customerName.replace(/"/g, '""')}"`,
      `"${order.customerEmail}"`,
      `"${order.customerPhone}"`,
      `"${order.shippingStreet.replace(/"/g, '""')}"`,
      `"${order.shippingCity}"`,
      `"${order.shippingCountry}"`,
      `"${order.items.replace(/"/g, '""')}"`,
      order.itemCount,
      order.subtotal,
      order.discount,
      order.shippingCost,
      order.totalAmount,
      `"${order.createdAt}"`,
      `"${order.updatedAt}"`
    ].join(','))
  ]

  const csv = csvRows.join('\n')

  // Set headers for file download
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`)

  return csv
})
