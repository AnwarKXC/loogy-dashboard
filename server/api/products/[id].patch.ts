import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import { Prisma } from '~/generated/prisma'
import prisma from '../../utils/prisma'
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
  price: z.coerce.number().min(0).optional(),
  salePrice: optionalNullableNumberSchema,
  quantity: z.coerce.number().int().min(0).optional(),
  categoryId: optionalIdSchema,
  brandId: optionalIdSchema
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

function updateLocalizedName(current: Record<string, unknown>, updates: { nameEn?: string, nameAr?: string }) {
  const next: Record<string, string> = {}
  const currentRecord = current as Record<string, string>

  if (updates.nameEn !== undefined) {
    next.en = updates.nameEn
  } else if (typeof currentRecord.en === 'string') {
    next.en = currentRecord.en
  }

  const nextArabic = updates.nameAr ?? currentRecord.ar
  if (nextArabic && nextArabic.trim().length > 0) {
    next.ar = nextArabic.trim()
  }

  return next
}

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const params = paramsSchema.parse(event.context.params ?? {})
  const body = await readBody(event)
  const payload = updateProductSchema.parse(body)

  const existing = await prisma.product.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const currentPrice = existing.price.toNumber()
  const nextPrice = payload.price ?? currentPrice
  const currentSalePrice = existing.salePrice?.toNumber() ?? null
  const nextSalePrice = payload.salePrice !== undefined ? payload.salePrice ?? null : currentSalePrice
  const discountPercentage = computeDiscountPercentage(nextPrice, nextSalePrice)

  if (nextSalePrice !== null && nextSalePrice > nextPrice) {
    throw createError({ statusCode: 400, statusMessage: 'Sale price cannot be greater than price' })
  }

  const data: Prisma.ProductUpdateInput = {}

  if (payload.nameEn !== undefined || payload.nameAr !== undefined) {
    data.name = updateLocalizedName(existing.name as Record<string, unknown>, {
      nameEn: payload.nameEn,
      nameAr: payload.nameAr
    })
  }

  if (payload.price !== undefined) {
    data.price = new Prisma.Decimal(nextPrice)
  }

  if (payload.salePrice !== undefined) {
    data.salePrice = nextSalePrice === null ? null : new Prisma.Decimal(nextSalePrice)
  }

  if (payload.quantity !== undefined) {
    data.quantity = payload.quantity
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

  const product = await prisma.product.update({
    where: { id: params.id },
    data,
    include: getProductInclude()
  })

  return {
    product: mapProductToDetail(product as unknown as ProductWithRelations)
  }
})
