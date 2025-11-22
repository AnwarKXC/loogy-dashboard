import { eventHandler, getQuery } from 'h3'
import { subDays, startOfDay } from 'date-fns'
import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).catch(30),
  limit: z.coerce.number().int().min(1).max(50).catch(10)
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = getQuery(event)
  const { days, limit } = querySchema.parse(query)

  const startDate = subDays(startOfDay(new Date()), days)

  // Get top selling products
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    where: {
      order: {
        createdAt: {
          gte: startDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        }
      }
    },
    _sum: {
      quantity: true,
      totalPrice: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        totalPrice: 'desc'
      }
    },
    take: limit
  })

  return topProducts.map(item => ({
    productId: item.productId,
    productName: item.productName,
    totalQuantity: item._sum.quantity || 0,
    totalRevenue: Number(item._sum.totalPrice || 0),
    orderCount: item._count.id
  }))
})
