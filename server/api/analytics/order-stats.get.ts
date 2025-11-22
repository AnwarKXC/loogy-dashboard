import { eventHandler } from 'h3'
import { subDays, startOfDay } from 'date-fns'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const today = startOfDay(new Date())
  const lastWeek = subDays(today, 7)
  const lastMonth = subDays(today, 30)

  // Get order counts by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: {
      id: true
    },
    _sum: {
      totalAmount: true
    }
  })

  // Get recent order stats
  const [
    totalOrders,
    ordersThisWeek,
    ordersThisMonth,
    ordersToday,
    pendingOrders,
    shippingCount,
    deliveredCount
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: lastWeek } }
    }),
    prisma.order.count({
      where: { createdAt: { gte: lastMonth } }
    }),
    prisma.order.count({
      where: { createdAt: { gte: today } }
    }),
    prisma.order.count({
      where: { status: 'PENDING' }
    }),
    prisma.order.count({
      where: { status: 'SHIPPING' }
    }),
    prisma.order.count({
      where: { status: 'DELIVERED' }
    })
  ])

  // Get average order value
  const avgOrderValue = await prisma.order.aggregate({
    _avg: {
      totalAmount: true
    },
    where: {
      status: {
        in: ['PENDING', 'SHIPPING', 'DELIVERED']
      }
    }
  })

  // Get revenue by payment method
  const revenueByPaymentMethod = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where: {
      status: {
        in: ['PENDING', 'SHIPPING', 'DELIVERED']
      }
    },
    _sum: {
      totalAmount: true
    },
    _count: {
      id: true
    }
  })

  return {
    total: totalOrders,
    thisWeek: ordersThisWeek,
    thisMonth: ordersThisMonth,
    today: ordersToday,
    byStatus: ordersByStatus.map(stat => ({
      status: stat.status,
      count: stat._count.id,
      revenue: Number(stat._sum.totalAmount || 0)
    })),
    statusCounts: {
      pending: pendingOrders,
      shipping: shippingCount,
      delivered: deliveredCount
    },
    averageOrderValue: Number(avgOrderValue._avg?.totalAmount || 0),
    byPaymentMethod: revenueByPaymentMethod.map(method => ({
      paymentMethod: method.paymentMethod,
      count: method._count?.id || 0,
      revenue: Number(method._sum?.totalAmount || 0)
    }))
  }
})
