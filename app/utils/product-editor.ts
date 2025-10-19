import type { ProductDetail, ProductEditorValues } from '~/types'

type LocalizedRecord = Record<string, unknown>

function isRecord(value: unknown): value is LocalizedRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function extractLocalized(record: unknown, locale: string): string {
  if (!isRecord(record)) {
    return ''
  }

  return toTrimmedString(record[locale])
}

function withFallback(value: string, fallback: string | null | undefined): string {
  if (value.trim().length > 0) {
    return value
  }

  return toTrimmedString(fallback)
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

export function mapProductDetailToEditorValues(product: ProductDetail): ProductEditorValues {
  const nameRecord = isRecord(product.raw?.name) ? product.raw.name : undefined
  const descriptionRecord = isRecord(product.raw?.description) ? product.raw.description : undefined
  const shortDescriptionRecord = isRecord(product.raw?.shortDescription) ? product.raw.shortDescription : undefined
  const seoRecord = isRecord(product.raw?.seo) ? product.raw.seo : undefined
  const normalizedSeo = isRecord(product.seo) ? product.seo : undefined

  const nameEn = withFallback(extractLocalized(nameRecord, 'en'), product.name)
  const nameAr = extractLocalized(nameRecord, 'ar')

  const descriptionEn = withFallback(extractLocalized(descriptionRecord, 'en'), product.description)
  const descriptionAr = extractLocalized(descriptionRecord, 'ar')
  const shortDescriptionEn = withFallback(extractLocalized(shortDescriptionRecord, 'en'), product.shortDescription)
  const shortDescriptionAr = extractLocalized(shortDescriptionRecord, 'ar')

  const seoTitle = toTrimmedString(seoRecord?.title ?? normalizedSeo?.title ?? product.seoTitle)
  const seoDescription = toTrimmedString(seoRecord?.description ?? normalizedSeo?.description ?? product.seoDescription)
  const seoCanonical = toTrimmedString(seoRecord?.canonical ?? normalizedSeo?.canonical ?? product.seoCanonical)
  const seoKeywordsSource = seoRecord?.keywords ?? normalizedSeo?.keywords ?? product.seoKeywords
  const seoKeywords = toStringArray(seoKeywordsSource)

  return {
    nameEn,
    nameAr,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    quantity: product.quantity,
    categoryId: product.category?.id ?? null,
    brandId: product.brand?.id ?? null,
    descriptionEn,
    descriptionAr,
    shortDescriptionEn,
    shortDescriptionAr,
    stock: product.stock ?? null,
    images: Array.isArray(product.images) ? [...product.images] : [],
    isArchived: product.isArchived,
    seoTitle,
    seoDescription,
    seoCanonical,
    seoKeywords
  }
}
