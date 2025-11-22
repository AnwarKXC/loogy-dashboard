import { eventHandler, getQuery } from 'h3'
import { startOfDay, subDays, format, eachDayOfInterval } from 'date-fns'
import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).catch(14)
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = getQuery(event)
  const { days } = querySchema.parse(query)

  const endDate = startOfDay(new Date())
  const startDate = subDays(endDate, days - 1)

  // Get all orders in the date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true,
      totalAmount: true,
      status: true
    }
  })

  // Create a map of dates to sales data
  const salesByDate = new Map<string, { revenue: number, orders: number }>()

  // Initialize all dates with zero
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
  dateRange.forEach((date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    salesByDate.set(dateKey, { revenue: 0, orders: 0 })
  })

  // Aggregate orders by date
  orders.forEach((order) => {
    const dateKey = format(startOfDay(order.createdAt), 'yyyy-MM-dd')
    const current = salesByDate.get(dateKey) || { revenue: 0, orders: 0 }

    salesByDate.set(dateKey, {
      revenue: current.revenue + Number(order.totalAmount),
      orders: current.orders + 1
    })
  })

  // Convert to array format for charts
  const chartData = Array.from(salesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders
    }))

  return chartData
})
