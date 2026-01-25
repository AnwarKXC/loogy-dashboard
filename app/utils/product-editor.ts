import type { ProductAvailabilityType, ProductDetail, ProductEditorValues } from '~/types'

type LocalizedRecord = Record<string, unknown>

function isRecord(value: unknown): value is LocalizedRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function _extractLocalized(record: unknown, locale: string): string {
  if (!isRecord(record)) {
    return ''
  }

  return toTrimmedString(record[locale])
}

function _withFallback(value: string, fallback: string | null | undefined): string {
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
  // Extract translations from raw.translations array
  const rawTranslations = (product.raw as { translations?: Array<{
    lang: string
    name: string
    shortDescription?: string | null
    description?: string | null
    metaTitle?: string | null
    metaDescription?: string | null
    metaKeywords?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: string | null
  }> })?.translations ?? []

  const enTrans = rawTranslations.find(t => t.lang === 'EN')
  const arTrans = rawTranslations.find(t => t.lang === 'AR')

  // Extract names from translations
  const nameEn = enTrans?.name?.trim() || product.name || ''
  const nameAr = arTrans?.name?.trim() || ''

  // Extract descriptions from translations
  const descriptionEn = enTrans?.description?.trim() || product.description || ''
  const descriptionAr = arTrans?.description?.trim() || ''
  const shortDescriptionEn = enTrans?.shortDescription?.trim() || product.shortDescription || ''
  const shortDescriptionAr = arTrans?.shortDescription?.trim() || ''

  const normalizedSeo = isRecord(product.seo) ? product.seo : undefined

  // Legacy SEO fields - fallback to English translation meta fields
  const seoTitle = toTrimmedString(normalizedSeo?.title ?? enTrans?.metaTitle ?? product.seoTitle)
  const seoDescription = toTrimmedString(normalizedSeo?.description ?? enTrans?.metaDescription ?? product.seoDescription)
  const seoCanonical = toTrimmedString(normalizedSeo?.canonical ?? product.seoCanonical ?? '')
  const seoKeywordsSource = normalizedSeo?.keywords ?? product.seoKeywords
  // Parse keywords from string or array
  const seoKeywords = typeof enTrans?.metaKeywords === 'string' && enTrans.metaKeywords
    ? enTrans.metaKeywords.split(',').map(k => k.trim()).filter(Boolean)
    : toStringArray(seoKeywordsSource)

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
    // Availability fields
    availabilityType: ((product as unknown as { availabilityType?: string }).availabilityType ?? 'IN_STOCK_EGYPT') as ProductAvailabilityType,
    expectedArrivalDate: (product as unknown as { expectedArrivalDate?: string | null }).expectedArrivalDate ?? null,
    seoTitle,
    seoDescription,
    seoCanonical,
    seoKeywords,
    // Bilingual SEO from translations
    seoTitleEn: enTrans?.metaTitle ?? '',
    seoTitleAr: arTrans?.metaTitle ?? '',
    seoDescriptionEn: enTrans?.metaDescription ?? '',
    seoDescriptionAr: arTrans?.metaDescription ?? '',
    seoKeywordsEn: enTrans?.metaKeywords ?? '',
    seoKeywordsAr: arTrans?.metaKeywords ?? '',
    ogTitleEn: enTrans?.ogTitle ?? '',
    ogTitleAr: arTrans?.ogTitle ?? '',
    ogDescriptionEn: enTrans?.ogDescription ?? '',
    ogDescriptionAr: arTrans?.ogDescription ?? '',
    translationsRaw: rawTranslations
  }
}
