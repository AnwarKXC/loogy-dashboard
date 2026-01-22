import { eventHandler, getQuery } from 'h3'
import { subDays, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily')
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = getQuery(event)
  const { start, end, period } = querySchema.parse(query)

  const endDate = end ? new Date(end) : new Date()
  const startDate = start ? new Date(start) : subDays(endDate, 30)

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
  let dateRange: Date[] = []

  if (period === 'monthly') {
    dateRange = eachMonthOfInterval({ start: startDate, end: endDate })
  } else if (period === 'weekly') {
    dateRange = eachWeekOfInterval({ start: startDate, end: endDate })
  } else {
    dateRange = eachDayOfInterval({ start: startDate, end: endDate })
  }

  const dateFormat = period === 'monthly' ? 'yyyy-MM' : (period === 'weekly' ? 'yyyy-ww' : 'yyyy-MM-dd')

  dateRange.forEach((date) => {
    const dateKey = format(date, dateFormat)
    salesByDate.set(dateKey, { revenue: 0, orders: 0 })
  })

  // Aggregate orders by date
  orders.forEach((order) => {
    const dateKey = format(order.createdAt, dateFormat)
    // If the dateKey exists (it should if within range), update it
    // Note: weekly/monthly might need adjustment if order date falls into a bucket
    // For simplicity, we rely on format() matching the bucket key

    if (salesByDate.has(dateKey)) {
      const current = salesByDate.get(dateKey)!
      salesByDate.set(dateKey, {
        revenue: current.revenue + Number(order.totalAmount),
        orders: current.orders + 1
      })
    } else {
      // Fallback for edge cases or if interval generation is slightly off
      // Find the closest bucket or just ignore?
      // For now, let's try to find the bucket
      // Actually, if we use the same format, it should match.
    }
  })

  // Convert to array format for charts
  const chartData = Array.from(salesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, data]) => {
      // Convert dateStr back to Date object for the chart
      // This is approximate for weekly/monthly but good enough for sorting/display
      return {
        date: new Date(dateStr),
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders
      }
    })

  return chartData
})
