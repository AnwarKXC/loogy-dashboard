import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

const BodySchema = z.object({
  stock: z.number().min(0),
  note: z.string().max(500).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)
  const body = await readValidatedBody(event, BodySchema.parse)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, stock: true, slug: true }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  const previousQty = product.stock
  const newQty = body.stock
  const difference = newQty - previousQty

  // Update product stock
  const updated = await prisma.product.update({
    where: { id },
    data: { stock: newQty },
    include: {
      translations: {
        where: { lang: 'AR' },
        select: { name: true }
      }
    }
  })

  // Record inventory movement
  await prisma.inventoryMovement.create({
    data: {
      productId: id,
      type: difference > 0 ? 'RESTOCK' : 'ADJUSTMENT',
      quantity: difference,
      previousQty,
      newQty,
      note: body.note ?? `Stock adjusted from ${previousQty} to ${newQty}`,
      createdById: admin.id
    }
  })

  return {
    id: updated.id,
    slug: updated.slug,
    name: updated.translations[0]?.name ?? updated.slug,
    previousStock: previousQty,
    newStock: newQty,
    difference,
    updatedAt: updated.updatedAt.toISOString()
  }
})
