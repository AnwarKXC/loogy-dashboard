import { eventHandler, createError, setResponseStatus } from 'h3'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER'] })

  const idParam = event.context.params?.id
  const categoryId = Number(idParam)

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid category id' })
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          children: true,
          products: true
        }
      }
    }
  })

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  if (category._count.children > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Remove subcategories before deleting this category' })
  }

  if (category._count.products > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Reassign or archive products before deleting this category' })
  }

  await prisma.category.delete({ where: { id: categoryId } })

  setResponseStatus(event, 200)

  return {
    category: {
      id: category.id,
      name: getLocalizedString(category.name) || category.slug
    }
  }
})
