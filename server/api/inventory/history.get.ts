import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const QuerySchema = z.object({
  productId: z.coerce.number().optional(),
  variantId: z.coerce.number().optional(),
  type: z.enum(['SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { productId, variantId, type, fromDate, toDate, page, limit } = query

  const where: Record<string, unknown> = {}

  if (productId) {
    where.productId = productId
  }

  if (variantId) {
    where.variantId = variantId
  }

  if (type) {
    where.type = type
  }

  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(fromDate)
    }
    if (toDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(toDate)
    }
  }

  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.inventoryMovement.count({ where })
  ])

  // Get product info for movements
  const productIds = [...new Set(movements.map(m => m.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        where: { lang: 'AR' },
        select: { name: true }
      }
    }
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  const history = movements.map((m) => {
    const product = productMap.get(m.productId)
    return {
      id: m.id,
      productId: m.productId,
      productName: product?.translations[0]?.name ?? product?.slug ?? 'Unknown',
      variantId: m.variantId,
      type: m.type,
      quantity: m.quantity,
      previousQty: m.previousQty,
      newQty: m.newQty,
      orderId: m.orderId,
      note: m.note,
      createdById: m.createdById,
      createdAt: m.createdAt.toISOString()
    }
  })

  return {
    history,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
})
