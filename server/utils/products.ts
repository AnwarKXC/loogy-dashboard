import type { Prisma, Product } from '@prisma/client'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'

const productInclude = {
  translations: {
    select: {
      lang: true,
      name: true,
      description: true,
      shortDescription: true,
      // SEO fields
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true
    }
  },
  category: {
    select: {
      id: true,
      slug: true,
      translations: {
        select: {
          lang: true,
          name: true,
          // SEO fields
          metaTitle: true,
          metaDescription: true,
          metaKeywords: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true
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
          name: true,
          // SEO fields
          metaTitle: true,
          metaDescription: true,
          metaKeywords: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true
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

export function getPreferredTranslation<T extends {
  lang: string
  [key: string]: string | null | undefined
}>(
  translations: T[] | null | undefined,
  field: string,
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

export interface SEOData {
  title: string
  description: string
  keywords: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
}

export function getProductSEO<T extends {
  lang: string
  name?: string | null
  shortDescription?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
}>(
  translations: T[] | null | undefined,
  fallbackName: string,
  fallbackDescription: string,
  productImage?: string | null,
  preferred: string[] = ['en', 'ar']
): SEOData {
  const metaTitle = getPreferredTranslation(translations, 'metaTitle', preferred)
  const metaDescription = getPreferredTranslation(translations, 'metaDescription', preferred)
  const metaKeywords = getPreferredTranslation(translations, 'metaKeywords', preferred)
  const ogTitle = getPreferredTranslation(translations, 'ogTitle', preferred)
  const ogDescription = getPreferredTranslation(translations, 'ogDescription', preferred)
  const ogImage = getPreferredTranslation(translations, 'ogImage', preferred)

  return {
    title: metaTitle || fallbackName,
    description: metaDescription || fallbackDescription,
    keywords: metaKeywords || null,
    ogTitle: ogTitle || metaTitle || fallbackName || null,
    ogDescription: ogDescription || metaDescription || fallbackDescription || null,
    ogImage: ogImage || productImage || null
  }
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
    isArchived: product.isArchived,
    // Availability fields
    availabilityType: (product as unknown as { availabilityType?: string }).availabilityType ?? 'IN_STOCK_EGYPT',
    expectedArrivalDate: (product as unknown as { expectedArrivalDate?: Date | null }).expectedArrivalDate?.toISOString() ?? null
  }
}

export function mapProductToDetail(product: ProductWithRelations) {
  const listItem = mapProductToListItem(product)
  const shortDescription = getPreferredTranslation(product.translations, 'shortDescription')
  const description = getPreferredTranslation(product.translations, 'description')

  return {
    ...listItem,
    images: product.images,
    description,
    shortDescription,
    seo: getProductSEO(
      product.translations,
      listItem.name,
      shortDescription || description,
      product.images[0] ?? null
    ),
    raw: {
      translations: product.translations
    }
  }
}
