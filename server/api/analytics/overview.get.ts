import { eventHandler, getQuery } from 'h3'
import { subDays, differenceInDays, sub } from 'date-fns'
import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = getQuery(event)
  const { start, end } = querySchema.parse(query)

  const endDate = end ? new Date(end) : new Date()
  const startDate = start ? new Date(start) : subDays(endDate, 30)

  const daysDiff = differenceInDays(endDate, startDate) || 1
  const previousStartDate = sub(startDate, { days: daysDiff })
  const previousEndDate = startDate

  // Get stats for current period
  const [orders, revenue, newCustomers] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalAmount: true
      }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ])

  // Optimized product stats query
  const productStats = await prisma.$queryRaw<[{ total: bigint, available: bigint }]>`
    SELECT 
      COUNT(*)::int as total, 
      COUNT(CASE WHEN stock > 0 THEN 1 END)::int as available 
    FROM "Product" 
    WHERE "isArchived" = false
  `
  const totalProducts = Number(productStats[0]?.total || 0)
  const availableProducts = Number(productStats[0]?.available || 0)

  // Get stats for previous period
  const [prevOrders, prevRevenue, prevNewCustomers] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      },
      _sum: {
        totalAmount: true
      }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      }
    })
  ])

  // Calculate variations
  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const currentRevenue = Number(revenue._sum.totalAmount || 0)
  const previousRevenueVal = Number(prevRevenue._sum.totalAmount || 0)

  return {
    revenue: {
      value: currentRevenue,
      variation: calculateVariation(currentRevenue, previousRevenueVal)
    },
    orders: {
      value: orders,
      variation: calculateVariation(orders, prevOrders)
    },
    customers: {
      value: newCustomers,
      variation: calculateVariation(newCustomers, prevNewCustomers)
    },
    products: {
      total: totalProducts,
      available: availableProducts
    }
  }
})
