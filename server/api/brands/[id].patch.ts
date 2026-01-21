import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { generateUniqueBrandSlug } from '../../utils/brands'

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

const updateBrandSchema = z.object({
  nameEn: z.string().trim().min(1, 'Brand name (English) is required').optional(),
  nameAr: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  logo: z.string().url().nullable().optional(),
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

  const idParam = event.context.params?.id
  const brandId = Number(idParam)

  if (!Number.isFinite(brandId) || brandId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid brand id' })
  }

  const existing = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      translations: true,
      _count: {
        select: { products: true }
      }
    }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Brand not found' })
  }

  const body = await readBody(event)
  const payload = updateBrandSchema.parse(body)

  const existingEn = existing.translations.find(t => t.lang === 'EN')
  const existingAr = existing.translations.find(t => t.lang === 'AR')

  const nextNameEn = payload.nameEn ?? existingEn?.name ?? existing.slug
  if (!nextNameEn || nextNameEn.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Brand name (English) is required' })
  }

  const slugSource = payload.nameEn ?? existing.slug
  const slug = await generateUniqueBrandSlug(slugSource, brandId)

  // Update brand
  const updated = await prisma.brand.update({
    where: { id: brandId },
    data: {
      slug,
      logo: payload.logo !== undefined ? payload.logo ?? null : existing.logo
    }
  })

  // Upsert English translation
  await prisma.brandTranslation.upsert({
    where: { brandId_lang: { brandId, lang: 'EN' } },
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
      brandId,
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
    await prisma.brandTranslation.upsert({
      where: { brandId_lang: { brandId, lang: 'AR' } },
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
        brandId,
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
  const translations = await prisma.brandTranslation.findMany({
    where: { brandId }
  })

  const enTranslation = translations.find(t => t.lang === 'EN')

  return {
    brand: {
      id: updated.id,
      name: enTranslation?.name ?? updated.slug,
      slug: updated.slug,
      logo: updated.logo,
      productCount: existing._count.products,
      translations
    }
  }
})
