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
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  const notifications = []

  // Add order notifications
  for (const order of recentOrders) {
    notifications.push({
      id: `order-${order.id}`,
      unread: order.status === 'PENDING',
      senderName: order.customerName,
      body: `placed order #${order.id} - ${order.status.toLowerCase()}`,
      date: order.createdAt.toISOString(),
      link: `/admin/orders/${order.id}`
    })
  }

  return notifications
})
