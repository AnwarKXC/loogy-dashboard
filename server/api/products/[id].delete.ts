import { createError, eventHandler } from 'h3'
import { z } from 'zod'

import type { Prisma } from '../../../app/generated/prisma'
import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getProductInclude, mapProductToListItem } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const params = paramsSchema.parse(event.context.params ?? {})

  const existing = await prisma.product.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const alreadyArchived = Boolean((existing as Record<string, unknown>).isArchived)

  if (alreadyArchived) {
    return {
      product: mapProductToListItem(existing as unknown as ProductWithRelations)
    }
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      isArchived: true
    } as unknown as Prisma.ProductUpdateInput,
    include: getProductInclude()
  })

  return {
    product: mapProductToListItem(product as unknown as ProductWithRelations)
  }
})
