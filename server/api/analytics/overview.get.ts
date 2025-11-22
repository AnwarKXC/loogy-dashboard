import { eventHandler } from 'h3'
import { startOfDay, subDays } from 'date-fns'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)
  const lastWeek = subDays(today, 7)

  // Get total orders and revenue
  const [totalOrders, totalRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    })
  ])

  // Get today's orders and revenue
  const [todayOrders, todayRevenue] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today
        }
      },
      _sum: {
        totalAmount: true
      }
    })
  ])

  // Get yesterday's orders and revenue for comparison
  const [yesterdayOrders, yesterdayRevenue] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      _sum: {
        totalAmount: true
      }
    })
  ])

  // Get last week's data
  const [lastWeekOrders, lastWeekRevenue] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: lastWeek
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: lastWeek
        }
      },
      _sum: {
        totalAmount: true
      }
    })
  ])

  // Get customer statistics
  const [totalCustomers, newCustomersToday, newCustomersThisWeek] = await Promise.all([
    prisma.user.count({
      where: {
        role: 'CUSTOMER'
      }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: today
        }
      }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: lastWeek
        }
      }
    })
  ])

  // Get product statistics
  const [totalProducts, activeProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        isArchived: false
      }
    })
  ])

  // Calculate percentages
  const ordersChange = yesterdayOrders > 0
    ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100
    : todayOrders > 0 ? 100 : 0

  const revenueChange = yesterdayRevenue._sum.totalAmount
    ? ((Number(todayRevenue._sum.totalAmount || 0) - Number(yesterdayRevenue._sum.totalAmount)) / Number(yesterdayRevenue._sum.totalAmount)) * 100
    : todayRevenue._sum.totalAmount ? 100 : 0

  return {
    overview: {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      todayOrders,
      todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
      ordersChange: Math.round(ordersChange * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      totalCustomers,
      newCustomersToday,
      newCustomersThisWeek,
      totalProducts,
      activeProducts
    },
    weekly: {
      orders: lastWeekOrders,
      revenue: Number(lastWeekRevenue._sum.totalAmount || 0)
    }
  }
})
