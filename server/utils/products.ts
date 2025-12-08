import type { Prisma, Product } from '@prisma/client'
import prisma from '../db'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'

const productInclude = {
  translations: {
    select: {
      lang: true,
      name: true,
      description: true,
      shortDescription: true
    }
  },
  category: {
    select: {
      id: true,
      slug: true,
      translations: {
        select: {
          lang: true,
          name: true
        }
      }
    }
  },
  brand: {
    select: {
      id: true,
      slug: true,
      translations: {
        select: {
          lang: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.ProductInclude

type PrismaProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude
}>

export type ProductWithRelations = PrismaProductWithRelations & {
  isArchived: boolean
}

export function getProductInclude() {
  return productInclude
}

export function getPreferredTranslation<T extends { lang: string, name?: string | null, description?: string | null, shortDescription?: string | null }>(
  translations: T[] | null | undefined,
  field: 'name' | 'description' | 'shortDescription',
  preferred: string[] = ['en', 'ar']
): string {
  if (!translations || translations.length === 0) return ''

  for (const lang of preferred) {
    const match = translations.find(t => t.lang.toLowerCase() === lang.toLowerCase())
    const value = match?.[field]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }

  for (const t of translations) {
    const value = t[field]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }

  return ''
}

export function getLocalizedString(value: unknown, preferred: string[] = ['en', 'ar']): string {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    for (const lang of preferred) {
      const entry = (value as Record<string, unknown>)[lang]
      if (typeof entry === 'string' && entry.trim().length > 0) {
        return entry
      }
    }

    for (const entry of Object.values(value as Record<string, unknown>)) {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        return entry
      }
    }
  }

  return ''
}

export function getInventoryStatus(quantity: number, stock: Product['stock']): InventoryStatus {
  const available = typeof stock === 'number' ? stock : quantity

  if (available <= 0) {
    return 'out_of_stock'
  }

  if (available <= 5) {
    return 'low_stock'
  }

  return 'in_stock'
}

export function getProductInventoryStatus(product: ProductWithRelations): InventoryStatus {
  if (product.isArchived) {
    return 'archived'
  }

  return getInventoryStatus(product.quantity, product.stock)
}

export function mapProductToListItem(product: ProductWithRelations) {
  const price = product.price.toNumber()
  const salePrice = product.salePrice?.toNumber() ?? null
  const discountPercentage = product.discountPercentage?.toNumber() ?? null
  const rating = product.rating?.toNumber() ?? null
  const preferredName = getPreferredTranslation(product.translations, 'name')

  return {
    id: product.id,
    name: preferredName,
    slug: product.slug,
    image: product.images[0] ?? null,
    price,
    salePrice,
    discountPercentage,
    rating,
    quantity: product.quantity,
    stock: product.stock,
    status: getProductInventoryStatus(product),
    updatedAt: product.updatedAt.toISOString(),
    category: product.category
      ? {
          id: product.category.id,
          name: getPreferredTranslation(product.category.translations, 'name'),
          slug: product.category.slug,
          translations: product.category.translations
        }
      : null,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: getPreferredTranslation(product.brand.translations, 'name'),
          slug: product.brand.slug,
          translations: product.brand.translations
        }
      : null,
    isArchived: product.isArchived
  }
}

export function mapProductToDetail(product: ProductWithRelations) {
  const listItem = mapProductToListItem(product)

  return {
    ...listItem,
    images: product.images,
    description: getPreferredTranslation(product.translations, 'description'),
    shortDescription: getPreferredTranslation(product.translations, 'shortDescription'),
    raw: {
      translations: product.translations
    }
  }
}
