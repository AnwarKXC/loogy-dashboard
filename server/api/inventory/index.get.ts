import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const QuerySchema = z.object({
  lowStockThreshold: z.coerce.number().min(0).default(10),
  outOfStockOnly: z.enum(['true', 'false']).optional(),
  categoryId: z.coerce.number().optional(),
  brandId: z.coerce.number().optional(),
  search: z.string().optional(),
  sort: z.enum(['stock-asc', 'stock-desc', 'name-asc', 'name-desc', 'updated']).default('stock-asc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const query = await getValidatedQuery(event, QuerySchema.parse)
  const { lowStockThreshold, outOfStockOnly, categoryId, brandId, search, sort, page, limit } = query

  // Build where clause
  const where: Record<string, unknown> = {
    isArchived: false,
    deletedAt: null
  }

  if (outOfStockOnly === 'true') {
    where.stock = 0
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (brandId) {
    where.brandId = brandId
  }

  if (search) {
    where.OR = [
      { slug: { contains: search, mode: 'insensitive' } },
      {
        translations: {
          some: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      }
    ]
  }

  // Build orderBy
  const orderByMap: Record<string, unknown> = {
    'stock-asc': { stock: 'asc' },
    'stock-desc': { stock: 'desc' },
    'name-asc': { slug: 'asc' },
    'name-desc': { slug: 'desc' },
    'updated': { updatedAt: 'desc' }
  }

  const [products, total, stats] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        translations: {
          where: { lang: 'AR' },
          select: { name: true }
        },
        category: {
          include: {
            translations: {
              where: { lang: 'AR' },
              select: { name: true }
            }
          }
        },
        brand: {
          include: {
            translations: {
              where: { lang: 'AR' },
              select: { name: true }
            }
          }
        },
        variants: {
          select: {
            id: true,
            sku: true,
            stock: true,
            attributes: true
          }
        }
      },
      orderBy: orderByMap[sort] as Record<string, string>,
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.product.count({ where }),
    // Get inventory stats
    prisma.product.aggregate({
      where: {
        isArchived: false,
        deletedAt: null
      },
      _sum: {
        stock: true
      },
      _avg: {
        stock: true
      },
      _count: {
        id: true
      }
    })
  ])

  // Get counts for different stock levels
  const [outOfStock, lowStock, inStock] = await Promise.all([
    prisma.product.count({
      where: {
        isArchived: false,
        deletedAt: null,
        stock: 0
      }
    }),
    prisma.product.count({
      where: {
        isArchived: false,
        deletedAt: null,
        stock: { gt: 0, lte: lowStockThreshold }
      }
    }),
    prisma.product.count({
      where: {
        isArchived: false,
        deletedAt: null,
        stock: { gt: lowStockThreshold }
      }
    })
  ])

  // Map products
  const inventory = products.map((product) => {
    const name = product.translations[0]?.name ?? product.slug
    const categoryName = product.category?.translations[0]?.name ?? product.category?.slug ?? null
    const brandName = product.brand?.translations[0]?.name ?? product.brand?.slug ?? null

    // Calculate total stock including variants
    const variantStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
    const totalStock = product.stock + variantStock

    // Determine status
    let status: 'out_of_stock' | 'low_stock' | 'in_stock'
    if (totalStock === 0) {
      status = 'out_of_stock'
    } else if (totalStock <= lowStockThreshold) {
      status = 'low_stock'
    } else {
      status = 'in_stock'
    }

    return {
      id: product.id,
      slug: product.slug,
      name,
      image: product.images[0] ?? null,
      stock: product.stock,
      variantStock,
      totalStock,
      status,
      price: product.price.toNumber(),
      salePrice: product.salePrice?.toNumber() ?? null,
      isPublished: product.isPublished,
      categoryId: product.categoryId,
      categoryName,
      brandId: product.brandId,
      brandName,
      variants: product.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        stock: v.stock,
        attributes: v.attributes
      })),
      updatedAt: product.updatedAt.toISOString()
    }
  })

  return {
    inventory,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    stats: {
      totalProducts: stats._count.id,
      totalStock: stats._sum.stock ?? 0,
      averageStock: Math.round(stats._avg.stock ?? 0),
      outOfStock,
      lowStock,
      inStock,
      lowStockThreshold
    }
  }
})
