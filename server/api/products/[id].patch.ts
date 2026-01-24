import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import { Prisma } from '@prisma/client'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getProductInclude, mapProductToDetail } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const optionalNullableNumberSchema = z.preprocess((value) => {
  if (value === null || value === '') {
    return null
  }

  return value
}, z.coerce.number().min(0).nullable()).optional()

const optionalIdSchema = z.preprocess((value) => {
  if (value === null || value === '') {
    return null
  }

  return value
}, z.coerce.number().int().positive().nullable()).optional()

const updateProductSchema = z.object({
  nameEn: z.string().trim().min(1, 'Product name (English) cannot be empty').optional(),
  nameAr: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  price: z.coerce.number().min(0).optional(),
  salePrice: optionalNullableNumberSchema,
  quantity: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: optionalIdSchema,
  brandId: optionalIdSchema,
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  shortDescriptionEn: z.string().trim().optional(),
  shortDescriptionAr: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isHeroFeatured: z.boolean().optional(),
  // Availability fields
  availabilityType: z.enum(['IN_STOCK_EGYPT', 'ARRIVING_SOON', 'PRE_ORDER']).optional(),
  expectedArrivalDate: z.preprocess((val) => {
    if (val === null || val === '' || val === undefined) return null
    return val
  }, z.string().nullable()).optional(),
  // Bilingual SEO fields
  seoTitleEn: z.string().trim().max(70).optional(),
  seoTitleAr: z.string().trim().max(70).optional(),
  seoDescriptionEn: z.string().trim().max(160).optional(),
  seoDescriptionAr: z.string().trim().max(160).optional(),
  seoKeywordsEn: z.string().trim().max(255).optional(),
  seoKeywordsAr: z.string().trim().max(255).optional(),
  ogTitleEn: z.string().trim().max(70).optional(),
  ogTitleAr: z.string().trim().max(70).optional(),
  ogDescriptionEn: z.string().trim().max(200).optional(),
  ogDescriptionAr: z.string().trim().max(200).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'No updates provided'
})

function computeDiscountPercentage(price: number, salePrice: number | null) {
  if (!salePrice || salePrice <= 0 || salePrice >= price) {
    return null
  }

  const discount = ((price - salePrice) / price) * 100

  return Math.round(discount * 100) / 100
}

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const params = paramsSchema.parse(event.context.params ?? {})
  const body = await readBody(event)
  const payload = updateProductSchema.parse(body)

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      translations: true
    }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  // Get existing translations for fallback values
  const existingEnTrans = existing.translations.find(t => t.lang === 'EN')
  const existingArTrans = existing.translations.find(t => t.lang === 'AR')

  const currentPrice = existing.price.toNumber()
  const nextPrice = payload.price ?? currentPrice
  const currentSalePrice = existing.salePrice?.toNumber() ?? null
  const nextSalePrice = payload.salePrice !== undefined ? payload.salePrice ?? null : currentSalePrice
  const discountPercentage = computeDiscountPercentage(nextPrice, nextSalePrice)

  if (nextSalePrice !== null && nextSalePrice > nextPrice) {
    throw createError({ statusCode: 400, statusMessage: 'Sale price cannot be greater than price' })
  }

  const data: Prisma.ProductUpdateInput = {}

  // Note: Product name is stored in ProductTranslation, not on the Product model directly
  // Name updates are handled in the translation upsert below

  if (payload.price !== undefined) {
    data.price = new Prisma.Decimal(nextPrice)
  }

  if (payload.salePrice !== undefined) {
    data.salePrice = nextSalePrice === null ? null : new Prisma.Decimal(nextSalePrice)
  }

  if (payload.quantity !== undefined) {
    data.stock = payload.quantity
  }

  // Also support 'stock' field directly
  if (payload.stock !== undefined) {
    data.stock = payload.stock
  }

  if (payload.categoryId !== undefined) {
    data.category = payload.categoryId === null
      ? { disconnect: true }
      : { connect: { id: payload.categoryId } }
  }

  if (payload.brandId !== undefined) {
    data.brand = payload.brandId === null
      ? { disconnect: true }
      : { connect: { id: payload.brandId } }
  }

  if (discountPercentage !== null) {
    data.discountPercentage = new Prisma.Decimal(discountPercentage)
  } else if (payload.salePrice !== undefined || payload.price !== undefined) {
    data.discountPercentage = null
  }

  // Availability fields
  if (payload.availabilityType !== undefined) {
    data.availabilityType = payload.availabilityType
  }

  if (payload.expectedArrivalDate !== undefined) {
    data.expectedArrivalDate = payload.expectedArrivalDate ? new Date(payload.expectedArrivalDate) : null
  }

  // Slug update
  if (payload.slug !== undefined) {
    data.slug = payload.slug
  }

  // Images update
  if (payload.images !== undefined) {
    data.images = payload.images
  }

  // Published status
  if (payload.isPublished !== undefined) {
    data.isPublished = payload.isPublished
  }

  // Archived status
  if (payload.isArchived !== undefined) {
    data.isArchived = payload.isArchived
  }

  // Hero featured status
  if (payload.isHeroFeatured !== undefined) {
    data.isHeroFeatured = payload.isHeroFeatured
  }

  // Update product first
  const _product = await prisma.product.update({
    where: { id: params.id },
    data,
    include: getProductInclude()
  })

  // Upsert translations for bilingual SEO
  const hasEnTranslation = payload.nameEn !== undefined || payload.descriptionEn !== undefined
    || payload.shortDescriptionEn !== undefined || payload.seoTitleEn !== undefined
    || payload.seoDescriptionEn !== undefined || payload.seoKeywordsEn !== undefined
    || payload.ogTitleEn !== undefined || payload.ogDescriptionEn !== undefined

  const hasArTranslation = payload.nameAr !== undefined || payload.descriptionAr !== undefined
    || payload.shortDescriptionAr !== undefined || payload.seoTitleAr !== undefined
    || payload.seoDescriptionAr !== undefined || payload.seoKeywordsAr !== undefined
    || payload.ogTitleAr !== undefined || payload.ogDescriptionAr !== undefined

  if (hasEnTranslation) {
    await prisma.productTranslation.upsert({
      where: { productId_lang: { productId: params.id, lang: 'EN' } },
      create: {
        productId: params.id,
        lang: 'EN',
        name: payload.nameEn || existingEnTrans?.name || '',
        shortDescription: payload.shortDescriptionEn || null,
        description: payload.descriptionEn || null,
        metaTitle: payload.seoTitleEn || null,
        metaDescription: payload.seoDescriptionEn || null,
        metaKeywords: payload.seoKeywordsEn || null,
        ogTitle: payload.ogTitleEn || null,
        ogDescription: payload.ogDescriptionEn || null
      },
      update: {
        name: payload.nameEn ?? existingEnTrans?.name ?? '',
        shortDescription: payload.shortDescriptionEn !== undefined ? (payload.shortDescriptionEn || null) : existingEnTrans?.shortDescription,
        description: payload.descriptionEn !== undefined ? (payload.descriptionEn || null) : existingEnTrans?.description,
        metaTitle: payload.seoTitleEn !== undefined ? (payload.seoTitleEn || null) : existingEnTrans?.metaTitle,
        metaDescription: payload.seoDescriptionEn !== undefined ? (payload.seoDescriptionEn || null) : existingEnTrans?.metaDescription,
        metaKeywords: payload.seoKeywordsEn !== undefined ? (payload.seoKeywordsEn || null) : existingEnTrans?.metaKeywords,
        ogTitle: payload.ogTitleEn !== undefined ? (payload.ogTitleEn || null) : existingEnTrans?.ogTitle,
        ogDescription: payload.ogDescriptionEn !== undefined ? (payload.ogDescriptionEn || null) : existingEnTrans?.ogDescription
      }
    })
  }

  if (hasArTranslation) {
    await prisma.productTranslation.upsert({
      where: { productId_lang: { productId: params.id, lang: 'AR' } },
      create: {
        productId: params.id,
        lang: 'AR',
        name: payload.nameAr || existingArTrans?.name || payload.nameEn || existingEnTrans?.name || '',
        shortDescription: payload.shortDescriptionAr || null,
        description: payload.descriptionAr || null,
        metaTitle: payload.seoTitleAr || null,
        metaDescription: payload.seoDescriptionAr || null,
        metaKeywords: payload.seoKeywordsAr || null,
        ogTitle: payload.ogTitleAr || null,
        ogDescription: payload.ogDescriptionAr || null
      },
      update: {
        name: payload.nameAr ?? existingArTrans?.name ?? '',
        shortDescription: payload.shortDescriptionAr !== undefined ? (payload.shortDescriptionAr || null) : existingArTrans?.shortDescription,
        description: payload.descriptionAr !== undefined ? (payload.descriptionAr || null) : existingArTrans?.description,
        metaTitle: payload.seoTitleAr !== undefined ? (payload.seoTitleAr || null) : existingArTrans?.metaTitle,
        metaDescription: payload.seoDescriptionAr !== undefined ? (payload.seoDescriptionAr || null) : existingArTrans?.metaDescription,
        metaKeywords: payload.seoKeywordsAr !== undefined ? (payload.seoKeywordsAr || null) : existingArTrans?.metaKeywords,
        ogTitle: payload.ogTitleAr !== undefined ? (payload.ogTitleAr || null) : existingArTrans?.ogTitle,
        ogDescription: payload.ogDescriptionAr !== undefined ? (payload.ogDescriptionAr || null) : existingArTrans?.ogDescription
      }
    })
  }

  // Refetch with updated translations
  const updatedProduct = await prisma.product.findUnique({
    where: { id: params.id },
    include: getProductInclude()
  })

  return {
    product: mapProductToDetail(updatedProduct as unknown as ProductWithRelations)
  }
})
