import { eventHandler, getRouterParam, createError } from 'h3'

import prisma from '../../../db'
import { getLocalizedString } from '../../../utils/products'

export default eventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Category slug is required'
    })
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  })

  if (!category) {
    throw createError({
      statusCode: 404,
      message: 'Category not found'
    })
  }

  return {
    id: category.id,
    name: getLocalizedString(category.name),
    slug: category.slug,
    parentId: category.parentId,
    productCount: category._count.products
  }
})
