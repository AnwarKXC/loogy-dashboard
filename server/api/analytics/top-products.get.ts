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

  // Get top selling products grouped by productId only
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        createdAt: {
          gte: startDate
        },
        status: {
          in: ['PENDING', 'SHIPPING', 'DELIVERED']
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

  // Fetch product names for the top products
  const productIds = topProducts.map(item => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        select: {
          lang: true,
          name: true
        }
      }
    }
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  return topProducts.map((item) => {
    const product = productMap.get(item.productId)
    const productName = product?.translations?.[0]?.name ?? product?.slug ?? `Product #${item.productId}`

    return {
      productId: item.productId,
      productName,
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.totalPrice || 0),
      orderCount: item._count.id
    }
  })
})
