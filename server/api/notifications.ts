import { subDays, startOfDay } from 'date-fns'
import prisma from '../db'
import { requireSuperAdmin } from '../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const lastWeek = subDays(startOfDay(new Date()), 7)

  // Get recent orders as notifications
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: lastWeek
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  })

  // Get new customer registrations
  const newCustomers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      createdAt: {
        gte: lastWeek
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  const notifications = []

  // Add order notifications
  for (const order of recentOrders) {
    notifications.push({
      id: `order-${order.id}`,
      unread: order.status === 'PENDING',
      sender: {
        name: order.user?.name || order.customerName,
        email: order.user?.email || order.customerEmail
      },
      body: `placed order #${order.id} - ${order.status.toLowerCase()}`,
      date: order.createdAt.toISOString(),
      link: `/orders/${order.id}`
    })
  }

  // Add new customer notifications
  for (const customer of newCustomers) {
    notifications.push({
      id: `customer-${customer.id}`,
      unread: true,
      sender: {
        name: customer.name,
        email: customer.email
      },
      body: 'registered as new customer',
      date: customer.createdAt.toISOString(),
      link: `/customers`
    })
  }

  // Sort by date (newest first)
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return notifications.slice(0, 50)
})
