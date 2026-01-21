import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { generateUniqueCategorySlug } from '../../utils/categories'

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

const updateCategorySchema = z.object({
  nameEn: z.string().trim().min(1, 'Category name (English) is required').optional(),
  nameAr: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  image: z.string().url().optional().nullable(),
  // SEO fields
  seoTitleEn: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  seoTitleAr: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  seoDescriptionEn: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH).optional(),
  seoDescriptionAr: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH).optional(),
  seoKeywordsEn: z.string().trim().optional(),
  seoKeywordsAr: z.string().trim().optional(),
  ogTitleEn: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  ogTitleAr: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  ogDescriptionEn: z.string().trim().max(200).optional(),
  ogDescriptionAr: z.string().trim().max(200).optional()
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
    include: {
      translations: true
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

  const existingEn = existing.translations.find(t => t.lang === 'EN')
  const existingAr = existing.translations.find(t => t.lang === 'AR')

  const nextNameEn = payload.nameEn ?? existingEn?.name ?? existing.slug
  if (!nextNameEn || nextNameEn.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Category name (English) is required' })
  }

  const slugSource = payload.nameEn ?? existing.slug
  const slug = await generateUniqueCategorySlug(slugSource, categoryId)

  // Update category
  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      slug,
      parentId: payload.parentId !== undefined ? payload.parentId ?? null : existing.parentId
    }
  })

  // Upsert English translation
  await prisma.categoryTranslation.upsert({
    where: { categoryId_lang: { categoryId, lang: 'EN' } },
    update: {
      name: nextNameEn,
      description: payload.descriptionEn ?? existingEn?.description,
      metaTitle: payload.seoTitleEn ?? existingEn?.metaTitle,
      metaDescription: payload.seoDescriptionEn ?? existingEn?.metaDescription,
      metaKeywords: payload.seoKeywordsEn ?? existingEn?.metaKeywords,
      ogTitle: payload.ogTitleEn ?? existingEn?.ogTitle,
      ogDescription: payload.ogDescriptionEn ?? existingEn?.ogDescription
    },
    create: {
      categoryId,
      lang: 'EN',
      name: nextNameEn,
      description: payload.descriptionEn ?? null,
      metaTitle: payload.seoTitleEn ?? null,
      metaDescription: payload.seoDescriptionEn ?? null,
      metaKeywords: payload.seoKeywordsEn ?? null,
      ogTitle: payload.ogTitleEn ?? null,
      ogDescription: payload.ogDescriptionEn ?? null
    }
  })

  // Upsert Arabic translation if provided
  const nextNameAr = payload.nameAr ?? existingAr?.name
  if (nextNameAr) {
    await prisma.categoryTranslation.upsert({
      where: { categoryId_lang: { categoryId, lang: 'AR' } },
      update: {
        name: nextNameAr,
        description: payload.descriptionAr ?? existingAr?.description,
        metaTitle: payload.seoTitleAr ?? existingAr?.metaTitle,
        metaDescription: payload.seoDescriptionAr ?? existingAr?.metaDescription,
        metaKeywords: payload.seoKeywordsAr ?? existingAr?.metaKeywords,
        ogTitle: payload.ogTitleAr ?? existingAr?.ogTitle,
        ogDescription: payload.ogDescriptionAr ?? existingAr?.ogDescription
      },
      create: {
        categoryId,
        lang: 'AR',
        name: nextNameAr,
        description: payload.descriptionAr ?? null,
        metaTitle: payload.seoTitleAr ?? null,
        metaDescription: payload.seoDescriptionAr ?? null,
        metaKeywords: payload.seoKeywordsAr ?? null,
        ogTitle: payload.ogTitleAr ?? null,
        ogDescription: payload.ogDescriptionAr ?? null
      }
    })
  }

  // Fetch updated translations
  const translations = await prisma.categoryTranslation.findMany({
    where: { categoryId }
  })

  const enTranslation = translations.find(t => t.lang === 'EN')

  return {
    category: {
      id: updated.id,
      slug: updated.slug,
      parentId: updated.parentId,
      name: enTranslation?.name ?? updated.slug,
      translations
    }
  }
})
