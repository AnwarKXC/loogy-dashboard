import { createError, eventHandler } from 'h3'
import { z } from 'zod'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getProductInclude, mapProductToDetail } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const parsedParams = paramsSchema.safeParse({
    id: event.context.params?.id
  })

  if (!parsedParams.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product id' })
  }

  const product = await prisma.product.findUnique({
    where: { id: parsedParams.data.id },
    include: getProductInclude()
  })

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return {
    product: mapProductToDetail(product as unknown as ProductWithRelations)
  }
})
