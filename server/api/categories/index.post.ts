import { eventHandler, readBody, setResponseStatus, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { generateUniqueCategorySlug } from '../../utils/categories'

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

const createCategorySchema = z.object({
  nameEn: z.string().trim().min(1, 'Category name (English) is required'),
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
      slug,
      parentId: payload.parentId ?? null,
      translations: {
        createMany: {
          data: [
            {
              lang: 'EN',
              name: payload.nameEn,
              description: payload.descriptionEn ?? null,
              metaTitle: payload.seoTitleEn ?? null,
              metaDescription: payload.seoDescriptionEn ?? null,
              metaKeywords: payload.seoKeywordsEn ?? null,
              ogTitle: payload.ogTitleEn ?? null,
              ogDescription: payload.ogDescriptionEn ?? null,
              ogImage: payload.image ?? null
            },
            ...(payload.nameAr
              ? [{
                  lang: 'AR' as const,
                  name: payload.nameAr,
                  description: payload.descriptionAr ?? null,
                  metaTitle: payload.seoTitleAr ?? null,
                  metaDescription: payload.seoDescriptionAr ?? null,
                  metaKeywords: payload.seoKeywordsAr ?? null,
                  ogTitle: payload.ogTitleAr ?? null,
                  ogDescription: payload.ogDescriptionAr ?? null,
                  ogImage: payload.image ?? null
                }]
              : [])
          ]
        }
      }
    },
    include: {
      translations: true
    }
  })

  const enTranslation = category.translations.find(t => t.lang === 'EN')

  setResponseStatus(event, 201)

  return {
    category: {
      id: category.id,
      slug: category.slug,
      parentId: category.parentId,
      name: enTranslation?.name ?? category.slug,
      translations: category.translations
    }
  }
})
