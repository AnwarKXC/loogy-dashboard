import { eventHandler, createError, setResponseStatus } from 'h3'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

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
          products: {
            where: { isArchived: false }
          }
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

  // Check for non-archived products only
  if (category._count.products > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Reassign or archive products before deleting this category' })
  }

  // Unlink archived products from this category before deleting
  await prisma.product.updateMany({
    where: { categoryId: categoryId, isArchived: true },
    data: { categoryId: null }
  })

  await prisma.category.delete({ where: { id: categoryId } })

  setResponseStatus(event, 200)

  return {
    category: {
      id: category.id,
      name: getLocalizedString(category.name) || category.slug
    }
  }
})
