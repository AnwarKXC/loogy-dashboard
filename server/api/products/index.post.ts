import { eventHandler, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'

import { Prisma } from '@prisma/client'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getProductInclude, mapProductToDetail } from '../../utils/products'
import type { ProductWithRelations } from '../../utils/products'

const createProductSchema = z.object({
  nameEn: z.string().trim().min(1, 'Product name (English) is required'),
  nameAr: z.string().trim().optional().default(''),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().int().min(0, 'Quantity must be positive'),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  brandId: z.coerce.number().int().positive().optional().nullable(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  shortDescriptionEn: z.string().trim().optional(),
  shortDescriptionAr: z.string().trim().optional(),
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
}).superRefine((data, ctx) => {
  if (data.salePrice != null && data.salePrice > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['salePrice'],
      message: 'Sale price cannot be greater than price'
    })
  }
})

function toSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

async function generateUniqueSlug(baseName: string) {
  const baseSlug = toSlug(baseName) || `product-${Date.now()}`
  let candidate = baseSlug
  let attempt = 1

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } })
    if (!existing) {
      return candidate
    }

    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }
}

function computeDiscountPercentage(price: number, salePrice: number | null) {
  if (!salePrice || salePrice <= 0 || salePrice >= price) {
    return null
  }

  const discount = ((price - salePrice) / price) * 100

  return Math.round(discount * 100) / 100
}

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const body = await readBody(event)
  const payload = createProductSchema.parse(body)

  const priceDecimal = new Prisma.Decimal(payload.price)
  const salePriceDecimal = payload.salePrice != null ? new Prisma.Decimal(payload.salePrice) : null
  const discountPercentage = computeDiscountPercentage(payload.price, payload.salePrice ?? null)

  const product = await prisma.product.create({
    data: {
      price: priceDecimal,
      salePrice: salePriceDecimal ?? undefined,
      discountPercentage: discountPercentage != null ? new Prisma.Decimal(discountPercentage) : undefined,
      stock: payload.quantity,
      slug: await generateUniqueSlug(payload.nameEn),
      images: [],
      categoryId: payload.categoryId ?? undefined,
      brandId: payload.brandId ?? undefined,
      translations: {
        createMany: {
          data: [
            {
              lang: 'EN',
              name: payload.nameEn,
              shortDescription: payload.shortDescriptionEn || null,
              description: payload.descriptionEn || null,
              metaTitle: payload.seoTitleEn || null,
              metaDescription: payload.seoDescriptionEn || null,
              metaKeywords: payload.seoKeywordsEn || null,
              ogTitle: payload.ogTitleEn || null,
              ogDescription: payload.ogDescriptionEn || null
            },
            {
              lang: 'AR',
              name: payload.nameAr || payload.nameEn,
              shortDescription: payload.shortDescriptionAr || null,
              description: payload.descriptionAr || null,
              metaTitle: payload.seoTitleAr || null,
              metaDescription: payload.seoDescriptionAr || null,
              metaKeywords: payload.seoKeywordsAr || null,
              ogTitle: payload.ogTitleAr || null,
              ogDescription: payload.ogDescriptionAr || null
            }
          ]
        }
      }
    },
    include: getProductInclude()
  })

  setResponseStatus(event, 201)

  return {
    product: mapProductToDetail(product as unknown as ProductWithRelations)
  }
})
