import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { createCategoryName, generateUniqueCategorySlug } from '../../utils/categories'

const updateCategorySchema = z.object({
  nameEn: z.string().trim().min(1, 'Category name (English) is required').optional(),
  nameAr: z.string().trim().optional(),
  parentId: z.coerce.number().int().positive().optional().nullable()
})

async function assertValidParent(categoryId: number, parentId: number | null) {
  if (parentId == null) {
    return
  }

  if (parentId === categoryId) {
    throw createError({ statusCode: 400, statusMessage: 'A category cannot be its own parent' })
  }

  let currentParentId: number | null = parentId

  while (currentParentId != null) {
    if (currentParentId === categoryId) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot assign category as a descendant of itself' })
    }

    const parentRecord: { parentId: number | null } | null = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    })

    if (!parentRecord) {
      throw createError({ statusCode: 400, statusMessage: 'Parent category not found' })
    }

    currentParentId = parentRecord.parentId
  }
}

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const idParam = event.context.params?.id
  const categoryId = Number(idParam)

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid category id' })
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true
    }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  const body = await readBody(event)
  const payload = updateCategorySchema.parse(body)

  if (payload.parentId !== undefined) {
    await assertValidParent(categoryId, payload.parentId ?? null)
  }

  const existingName = existing.name as Record<string, unknown>

  const nextNameEn = payload.nameEn ?? (typeof existingName.en === 'string' ? existingName.en : existing.slug)
  if (!nextNameEn || nextNameEn.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Category name (English) is required' })
  }

  const nextNameAr = payload.nameAr !== undefined
    ? payload.nameAr
    : typeof existingName.ar === 'string'
      ? existingName.ar
      : undefined

  const slugSource = payload.nameEn ?? existing.slug
  const slug = await generateUniqueCategorySlug(slugSource, categoryId)

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: createCategoryName(nextNameEn, nextNameAr),
      slug,
      parentId: payload.parentId !== undefined ? payload.parentId ?? null : existing.parentId
    }
  })

  return {
    category: {
      id: updated.id,
      slug: updated.slug,
      parentId: updated.parentId,
      name: getLocalizedString(updated.name) || updated.slug
    }
  }
})
