import type { Prisma, Product } from '@prisma/client'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'

const productInclude = {
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
  },
  translations: {
    select: {
      lang: true,
      name: true,
      shortDescription: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true
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

export function getLocalizedString(jsonValue: unknown, fallback = 'en'): string {
  if (!jsonValue || typeof jsonValue !== 'object') {
    return ''
  }

  const record = jsonValue as Record<string, unknown>
  const localized = record[fallback]

  if (typeof localized === 'string' && localized.trim().length > 0) {
    return localized
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return ''
}

export function getInventoryStatus(stock: Product['stock']): InventoryStatus {
  const available = typeof stock === 'number' ? stock : 0

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

  return getInventoryStatus(product.stock)
}

function getPreferredTranslation<T extends { lang: string, name?: string | null }>(translations: T[] | null | undefined, field: keyof Omit<T, 'lang'>, preferred: string[] = ['en', 'ar']): string {
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
    stock: product.stock,
    status: getProductInventoryStatus(product),
    availabilityType: product.availabilityType,
    expectedArrivalDate: product.expectedArrivalDate?.toISOString() ?? null,
    updatedAt: product.updatedAt.toISOString(),
    category: product.category
      ? {
          id: product.category.id,
          name: getPreferredTranslation(product.category.translations, 'name'),
          slug: product.category.slug
        }
      : null,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: getPreferredTranslation(product.brand.translations, 'name'),
          slug: product.brand.slug
        }
      : null,
    isArchived: product.isArchived
  }
}

export function mapProductToDetail(product: ProductWithRelations) {
  const listItem = mapProductToListItem(product)

  // Get translations for bilingual SEO
  const translations = product.translations ?? []
  const description = getPreferredTranslation(translations as Array<{ lang: string, name?: string | null, description?: string | null }>, 'description' as 'name')
  const shortDescription = getPreferredTranslation(translations as Array<{ lang: string, name?: string | null, shortDescription?: string | null }>, 'shortDescription' as 'name')

  return {
    ...listItem,
    images: product.images,
    description,
    shortDescription,
    translationsRaw: translations,
    raw: {
      translations
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseSeoMetadata(value: unknown) {
  if (!isPlainObject(value)) {
    return null
  }

  const title = typeof value.title === 'string' ? value.title : undefined
  const description = typeof value.description === 'string' ? value.description : undefined
  const canonical = typeof value.canonical === 'string' ? value.canonical : undefined
  const keywords = Array.isArray(value.keywords)
    ? value.keywords.filter((keyword): keyword is string => typeof keyword === 'string' && keyword.trim().length > 0)
    : []

  if (!title && !description && !canonical && keywords.length === 0) {
    return null
  }

  return {
    title,
    description,
    canonical,
    keywords
  }
}
