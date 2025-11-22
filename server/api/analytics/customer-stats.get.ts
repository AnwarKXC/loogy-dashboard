import { eventHandler } from 'h3'
import { subDays, startOfDay } from 'date-fns'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const today = startOfDay(new Date())
  const lastWeek = subDays(today, 7)
  const lastMonth = subDays(today, 30)

  // Get customer registration stats
  const [
    totalCustomers,
    customersThisWeek,
    customersThisMonth,
    customersToday
  ] = await Promise.all([
    prisma.user.count({
      where: { role: 'CUSTOMER' }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: lastWeek }
      }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: lastMonth }
      }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: today }
      }
    })
  ])

  // Get top customers by order value
  const topCustomers = await prisma.order.groupBy({
    by: ['userId'],
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
    },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: 10
  })

  // Get user details for top customers
  const topCustomersWithDetails = await Promise.all(
    topCustomers.map(async (customer) => {
      if (!customer.userId) return null

      const user = await prisma.user.findUnique({
        where: { id: customer.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      })

      return {
        ...user,
        totalSpent: Number(customer._sum?.totalAmount || 0),
        orderCount: customer._count?.id || 0
      }
    })
  )

  // Get customers with abandoned carts
  const abandonedCarts = await prisma.cart.count({
    where: {
      items: {
        some: {}
      },
      user: {
        orders: {
          none: {
            createdAt: {
              gte: subDays(today, 7)
            }
          }
        }
      }
    }
  })

  return {
    total: totalCustomers,
    thisWeek: customersThisWeek,
    thisMonth: customersThisMonth,
    today: customersToday,
    topCustomers: topCustomersWithDetails,
    abandonedCarts
  }
})
