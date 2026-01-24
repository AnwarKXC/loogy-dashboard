import { createError, eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '@prisma/client'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getProductInclude, mapProductToListItem } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const querySchema = z.object({
  permanent: z.coerce.boolean().optional().default(false)
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const params = paramsSchema.parse(event.context.params ?? {})
  const query = querySchema.parse(getQuery(event))

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    include: getProductInclude()
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  // Permanent delete
  if (query.permanent) {
    await prisma.product.delete({
      where: { id: params.id }
    })

    return {
      product: mapProductToListItem(existing as unknown as ProductWithRelations),
      deleted: true
    }
  }

  // Archive (soft delete)
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
