import { eventHandler, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'

import { Prisma } from '~/generated/prisma'
import prisma from '../../utils/prisma'
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
  brandId: z.coerce.number().int().positive().optional().nullable()
}).superRefine((data, ctx) => {
  if (data.salePrice != null && data.salePrice > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['salePrice'],
      message: 'Sale price cannot be greater than price'
    })
  }
})

function createLocalizedName(en: string, ar?: string) {
  const value: Record<string, string> = {}

  if (en.trim().length > 0) {
    value.en = en.trim()
  }

  if (ar && ar.trim().length > 0) {
    value.ar = ar.trim()
  }

  return value
}

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
      name: createLocalizedName(payload.nameEn, payload.nameAr),
      price: priceDecimal,
      salePrice: salePriceDecimal ?? undefined,
      discountPercentage: discountPercentage != null ? new Prisma.Decimal(discountPercentage) : undefined,
      quantity: payload.quantity,
      slug: await generateUniqueSlug(payload.nameEn),
      images: [],
      stock: null,
      rating: null,
      categoryId: payload.categoryId ?? undefined,
      brandId: payload.brandId ?? undefined
    },
    include: getProductInclude()
  })

  setResponseStatus(event, 201)

  return {
    product: mapProductToDetail(product as unknown as ProductWithRelations)
  }
})
