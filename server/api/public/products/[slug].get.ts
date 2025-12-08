import { eventHandler, getRouterParam, createError } from 'h3'

import prisma from '../../../db'
import { getProductInclude, mapProductToDetail } from '../../../utils/products'
import type { ProductWithRelations } from '../../../utils/products'

export default eventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Product slug is required'
    })
  }

  const product = await prisma.product.findUnique({
    where: {
      slug,
      isArchived: false
    },
    include: getProductInclude()
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  return mapProductToDetail(product as unknown as ProductWithRelations)
})
