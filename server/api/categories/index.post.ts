import { eventHandler, readBody, setResponseStatus, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { createCategoryName, generateUniqueCategorySlug } from '../../utils/categories'

const createCategorySchema = z.object({
  nameEn: z.string().trim().min(1, 'Category name (English) is required'),
  nameAr: z.string().trim().optional(),
  parentId: z.coerce.number().int().positive().optional().nullable()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readBody(event)
  const payload = createCategorySchema.parse(body)

  if (payload.parentId != null) {
    const parent = await prisma.category.findUnique({
      where: { id: payload.parentId },
      select: { id: true }
    })

    if (!parent) {
      throw createError({ statusCode: 400, statusMessage: 'Parent category not found' })
    }
  }

  const slug = await generateUniqueCategorySlug(payload.nameEn)

  const category = await prisma.category.create({
    data: {
      name: createCategoryName(payload.nameEn, payload.nameAr),
      slug,
      parentId: payload.parentId ?? null
    }
  })

  setResponseStatus(event, 201)

  return {
    category: {
      id: category.id,
      slug: category.slug,
      parentId: category.parentId,
      name: getLocalizedString(category.name) || category.slug
    }
  }
})
