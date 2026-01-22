<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { CategoryTreeNode, ProductBasePayload, ProductEditorValues, ProductFilterOption } from '~/types'
import { flattenCategoryTree } from '~/utils/categories'
import S3ImageUploader from '~/components/media/S3ImageUploader.vue'

const props = defineProps<{
  mode: 'create' | 'edit' | 'duplicate'
  initialValues?: Partial<ProductEditorValues>
  categories?: CategoryTreeNode[]
  brands?: ProductFilterOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', values: ProductBasePayload): void
  (e: 'open-category-create' | 'open-brand-create'): void
}>()

const MAX_DESCRIPTION_LENGTH = 2000
const MAX_SHORT_DESCRIPTION_LENGTH = 400
const MAX_SEO_TITLE_LENGTH = 80
const MAX_SEO_DESCRIPTION_LENGTH = 160
const MAX_SLUG_LENGTH = 120
const MAX_SEO_KEYWORDS = 15

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, MAX_SLUG_LENGTH)
}

const optionalMoneyField = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  return value
}, z.number().min(0).nullable()).optional()

const optionalStockField = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  return value
}, z.number().int().min(0).nullable()).optional()

const requiredLabel = (label: string) => `${label} *`

const schema = z.object({
  nameEn: z.string().trim().min(1, 'Enter a product name'),
  nameAr: z.string().trim().optional().default(''),
  slug: z.string().trim().max(MAX_SLUG_LENGTH, `Slug must be under ${MAX_SLUG_LENGTH} characters`).optional(),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  salePrice: optionalMoneyField,
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  stock: optionalStockField,
  categoryId: z.number().int().positive().nullable().optional(),
  brandId: z.number().int().positive().nullable().optional(),
  descriptionEn: z.string().trim().max(MAX_DESCRIPTION_LENGTH, 'Description is too long').optional(),
  descriptionAr: z.string().trim().max(MAX_DESCRIPTION_LENGTH, 'Description (Arabic) is too long').optional(),
  shortDescriptionEn: z.string().trim().max(MAX_SHORT_DESCRIPTION_LENGTH, 'Short description is too long').optional(),
  shortDescriptionAr: z.string().trim().max(MAX_SHORT_DESCRIPTION_LENGTH, 'Short description (Arabic) is too long').optional(),
  images: z.array(z.string().trim()).default([]),
  isArchived: z.boolean().default(false),
  // Legacy single-language SEO (kept for AI generator)
  seoTitle: z.string().trim().max(MAX_SEO_TITLE_LENGTH, 'SEO title is too long').optional(),
  seoDescription: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH, 'SEO description is too long').optional(),
  seoCanonical: z.string().trim().max(255, 'Canonical URL is too long').optional(),
  seoKeywords: z.array(z.string().trim().max(60)).max(MAX_SEO_KEYWORDS).default([]),
  // Bilingual SEO fields
  seoTitleEn: z.string().trim().max(70, 'SEO title (EN) is too long').optional(),
  seoTitleAr: z.string().trim().max(70, 'SEO title (AR) is too long').optional(),
  seoDescriptionEn: z.string().trim().max(160, 'SEO description (EN) is too long').optional(),
  seoDescriptionAr: z.string().trim().max(160, 'SEO description (AR) is too long').optional(),
  seoKeywordsEn: z.string().trim().max(255, 'SEO keywords (EN) is too long').optional(),
  seoKeywordsAr: z.string().trim().max(255, 'SEO keywords (AR) is too long').optional(),
  ogTitleEn: z.string().trim().max(70, 'OG title (EN) is too long').optional(),
  ogTitleAr: z.string().trim().max(70, 'OG title (AR) is too long').optional(),
  ogDescriptionEn: z.string().trim().max(200, 'OG description (EN) is too long').optional(),
  ogDescriptionAr: z.string().trim().max(200, 'OG description (AR) is too long').optional()
})

function toNumberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function createStateFromInitialValues(initial?: Partial<ProductEditorValues>) {
  const images = Array.isArray(initial?.images) ? initial.images.filter((item: unknown): item is string => typeof item === 'string') : []
  const seoKeywords = Array.isArray(initial?.seoKeywords) ? initial.seoKeywords.filter((keyword: unknown): keyword is string => typeof keyword === 'string') : []

  // Extract SEO from translations if available
  const translations = initial?.translationsRaw ?? []
  const enTrans = translations.find(t => t.lang === 'EN')
  const arTrans = translations.find(t => t.lang === 'AR')

  return {
    nameEn: initial?.nameEn ?? '',
    nameAr: initial?.nameAr ?? '',
    slug: typeof initial?.slug === 'string' ? initial.slug : '',
    price: toNumberOr(initial?.price, 0),
    salePrice: toNullableNumber(initial?.salePrice),
    quantity: toNumberOr(initial?.quantity, 0),
    stock: toNullableNumber(initial?.stock),
    categoryId: typeof initial?.categoryId === 'number' ? initial.categoryId : null,
    brandId: typeof initial?.brandId === 'number' ? initial.brandId : null,
    descriptionEn: initial?.descriptionEn ?? '',
    descriptionAr: initial?.descriptionAr ?? '',
    shortDescriptionEn: initial?.shortDescriptionEn ?? '',
    shortDescriptionAr: initial?.shortDescriptionAr ?? '',
    images: [...images],
    isArchived: initial?.isArchived ?? false,
    // Legacy SEO (for AI generator)
    seoTitle: initial?.seoTitle ?? '',
    seoDescription: initial?.seoDescription ?? '',
    seoCanonical: initial?.seoCanonical ?? '',
    seoKeywords: [...seoKeywords],
    newSeoKeyword: '',
    // Bilingual SEO fields
    seoTitleEn: initial?.seoTitleEn ?? enTrans?.metaTitle ?? '',
    seoTitleAr: initial?.seoTitleAr ?? arTrans?.metaTitle ?? '',
    seoDescriptionEn: initial?.seoDescriptionEn ?? enTrans?.metaDescription ?? '',
    seoDescriptionAr: initial?.seoDescriptionAr ?? arTrans?.metaDescription ?? '',
    seoKeywordsEn: initial?.seoKeywordsEn ?? enTrans?.metaKeywords ?? '',
    seoKeywordsAr: initial?.seoKeywordsAr ?? arTrans?.metaKeywords ?? '',
    ogTitleEn: initial?.ogTitleEn ?? enTrans?.ogTitle ?? '',
    ogTitleAr: initial?.ogTitleAr ?? arTrans?.ogTitle ?? '',
    ogDescriptionEn: initial?.ogDescriptionEn ?? enTrans?.ogDescription ?? '',
    ogDescriptionAr: initial?.ogDescriptionAr ?? arTrans?.ogDescription ?? ''
  }
}

const state = reactive(createStateFromInitialValues(props.initialValues))

const hasManuallyEditedSlug = ref(state.slug.length > 0 && state.slug !== slugify(state.nameEn))
const showBilingualSeo = ref(false)

const submitLabel = computed(() => {
  if (props.mode === 'edit') {
    return 'Update product'
  }
  if (props.mode === 'duplicate') {
    return 'Create copy'
  }
  return 'Create product'
})

const categoryItems = computed(() => {
  const tree = props.categories ?? []
  const flattened = flattenCategoryTree(tree)

  return [
    { label: 'No category', value: null },
    ...flattened.map((category: CategoryTreeNode) => ({
      label: `${category.depth > 0 ? `${'-'.repeat(category.depth * 2)} ` : ''}${category.name || `Category #${category.id}`}`,
      value: category.id
    }))
  ]
})

const brandItems = computed(() => {
  const options = props.brands ?? []

  return [
    { label: 'No brand', value: null },
    ...options.map(option => ({
      label: option.name || `Brand #${option.id}`,
      value: option.id
    }))
  ]
})

const brandNameMap = computed(() => {
  const result = new Map<number, string>()

  for (const option of props.brands ?? []) {
    if (typeof option.id === 'number' && option.name) {
      result.set(option.id, option.name)
    }
  }

  return result
})

const categoryNameMap = computed(() => {
  const result = new Map<number, string>()
  const tree = props.categories ?? []
  const flattened = flattenCategoryTree(tree)

  for (const category of flattened) {
    if (typeof category.id === 'number' && category.name) {
      result.set(category.id, category.name)
    }
  }

  return result
})

function getBrandName(id: number | null | undefined) {
  if (typeof id !== 'number') {
    return ''
  }
  return brandNameMap.value.get(id) ?? ''
}

function getCategoryName(id: number | null | undefined) {
  if (typeof id !== 'number') {
    return ''
  }
  return categoryNameMap.value.get(id) ?? ''
}

function normalizeSlugToPath(slug?: string | null) {
  if (!slug) {
    return ''
  }

  const trimmed = `${slug}`.trim()

  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const sanitized = trimmed.replace(/^\/+/u, '')
  return sanitized ? `/${sanitized}` : ''
}

const salePriceInvalid = computed(() => {
  if (typeof state.salePrice !== 'number' || Number.isNaN(state.salePrice)) {
    return false
  }
  if (state.price <= 0) {
    return false
  }
  return state.salePrice >= state.price
})

const discountPercentage = computed(() => {
  if (salePriceInvalid.value) {
    return null
  }
  if (typeof state.salePrice !== 'number' || state.salePrice === null) {
    return null
  }
  if (state.price <= 0) {
    return null
  }
  if (state.salePrice <= 0) {
    return null
  }
  const discount = Math.round(((state.price - state.salePrice) / state.price) * 100)
  return Number.isFinite(discount) ? Math.max(discount, 0) : null
})

const slugHelp = computed(() => (hasManuallyEditedSlug.value ? 'You are editing the slug manually.' : 'Slug updates automatically from the English name.'))
const suggestedSlug = computed(() => slugify(state.nameEn))

const descriptionEnLength = computed(() => state.descriptionEn.trim().length)
const descriptionArLength = computed(() => state.descriptionAr.trim().length)
const shortDescriptionEnLength = computed(() => state.shortDescriptionEn.trim().length)
const shortDescriptionArLength = computed(() => state.shortDescriptionAr.trim().length)
const seoTitleLength = computed(() => state.seoTitle.trim().length)
const seoDescriptionLength = computed(() => state.seoDescription.trim().length)
const seoKeywordRemaining = computed(() => Math.max(0, MAX_SEO_KEYWORDS - state.seoKeywords.length))

const seoKeywordHelp = computed(() => {
  if (seoKeywordRemaining.value === 0) {
    return 'Keyword limit reached.'
  }
  const remaining = seoKeywordRemaining.value
  const suffix = remaining === 1 ? 'keyword' : 'keywords'
  return `${remaining} ${suffix} remaining`
})

const SEO_ADJECTIVES = ['Premium', 'Best-Selling', 'Limited Edition', 'Essential', 'Customer Favorite']
const SEO_HOOKS = ['Shop Now', 'Fast Delivery', 'Limited Stock', 'Secure Checkout', 'Free Returns']
const SEO_OPENERS = ['Discover', 'Experience', 'Shop', 'Upgrade with', 'Get your']
const SEO_CLOSERS = ['Order today for fast delivery.', 'Hassle-free returns guaranteed.', 'Secure checkout in seconds.', 'Limited stock — act now.', 'Join thousands of happy customers.']
const COPY_FEATURES = ['Crafted for daily use', 'Built with durable materials', 'Designed for effortless comfort', 'Ready for modern lifestyles', 'Optimized for reliable performance']
const COPY_AR_OPENERS = ['Discover', 'Enjoy', 'Upgrade to', 'Get', 'Make it']
const COPY_AR_HOOKS = ['Fast Shipping', 'Limited Offer', 'Secure Payment', 'Best Price', 'Trusted Service']
const COPY_AR_CLOSERS = ['Order now and enjoy fast shipping.', 'Enjoy a seamless experience with trusted service.', 'Make it your choice today with quality guarantee.', 'Do not miss out, limited quantity available.', 'A perfect choice for your customers daily.']

const lastGeneratedContent = reactive({
  seoTitle: null as string | null,
  seoDescription: null as string | null,
  seoKeywords: null as string[] | null,
  descriptionEn: null as string | null,
  descriptionAr: null as string | null,
  shortDescriptionEn: null as string | null,
  shortDescriptionAr: null as string | null
})

function resetGeneratedContentTracking() {
  lastGeneratedContent.seoTitle = null
  lastGeneratedContent.seoDescription = null
  lastGeneratedContent.seoKeywords = null
  lastGeneratedContent.descriptionEn = null
  lastGeneratedContent.descriptionAr = null
  lastGeneratedContent.shortDescriptionEn = null
  lastGeneratedContent.shortDescriptionAr = null
}

function applyInitialValues(initial?: Partial<ProductEditorValues>) {
  const resolved = createStateFromInitialValues(initial)

  state.nameEn = resolved.nameEn
  state.nameAr = resolved.nameAr
  state.price = resolved.price
  state.salePrice = resolved.salePrice
  state.quantity = resolved.quantity
  state.stock = resolved.stock
  state.categoryId = resolved.categoryId
  state.brandId = resolved.brandId
  state.descriptionEn = resolved.descriptionEn
  state.descriptionAr = resolved.descriptionAr
  state.shortDescriptionEn = resolved.shortDescriptionEn
  state.shortDescriptionAr = resolved.shortDescriptionAr
  state.images = [...resolved.images]
  state.isArchived = resolved.isArchived
  state.seoTitle = resolved.seoTitle
  state.seoDescription = resolved.seoDescription
  state.seoCanonical = resolved.seoCanonical
  state.seoKeywords = [...resolved.seoKeywords]
  state.newSeoKeyword = ''

  const fallbackSlug = slugify(resolved.nameEn)
  const providedSlug = resolved.slug.trim()
  state.slug = providedSlug || fallbackSlug
  hasManuallyEditedSlug.value = providedSlug.length > 0 && providedSlug !== fallbackSlug

  resetGeneratedContentTracking()

  canonicalFollowsSlug.value = !state.seoCanonical || state.seoCanonical === normalizeSlugToPath(state.slug)

  if (shouldAutoPopulateSeo.value) {
    populateSeoIfEmpty()
  }
}

let isApplyingGeneratedSeo = false
const canonicalFollowsSlug = ref(!state.seoCanonical || state.seoCanonical === normalizeSlugToPath(state.slug))
const shouldAutoPopulateSeo = computed(() => false)

type GenerationLoadingKey = 'title' | 'description' | 'keywords' | 'all' | 'descriptionEn' | 'descriptionAr' | 'shortDescriptionEn' | 'shortDescriptionAr' | 'descriptions' | 'shortDescriptions'

const generationLoading = reactive<Record<GenerationLoadingKey, boolean>>({
  title: false,
  description: false,
  keywords: false,
  all: false,
  descriptionEn: false,
  descriptionAr: false,
  shortDescriptionEn: false,
  shortDescriptionAr: false,
  descriptions: false,
  shortDescriptions: false
})
const generationErrorMessage = ref<string | null>(null)
let contentAbortController: AbortController | null = null

const salePriceHelp = computed(() => {
  if (salePriceInvalid.value) {
    return 'Sale price must be lower than the base price.'
  }
  if (discountPercentage.value !== null) {
    return `Discount: ${discountPercentage.value}% off`
  }
  return 'Optional discounted price.'
})

watch(
  () => props.initialValues,
  (next) => {
    applyInitialValues(next)
  },
  { deep: true, immediate: true }
)

watch(
  () => state.nameEn,
  (value) => {
    if (!hasManuallyEditedSlug.value || !state.slug) {
      state.slug = slugify(value)
      hasManuallyEditedSlug.value = false
    }
  }
)

watch(
  () => state.slug,
  (value) => {
    const normalized = value ? slugify(value) : ''

    if (value !== normalized) {
      state.slug = normalized
      return
    }

    hasManuallyEditedSlug.value = normalized.length > 0 && normalized !== slugify(state.nameEn)

    if (canonicalFollowsSlug.value || !state.seoCanonical) {
      const nextCanonical = normalizeSlugToPath(normalized)

      if (nextCanonical && state.seoCanonical !== nextCanonical) {
        isApplyingGeneratedSeo = true
        state.seoCanonical = nextCanonical
        isApplyingGeneratedSeo = false
      }

      canonicalFollowsSlug.value = !state.seoCanonical || state.seoCanonical === nextCanonical
    }
  }
)

watch(
  () => state.salePrice,
  (value) => {
    if (value === undefined || value === null) {
      return
    }

    if ((typeof value === 'string' && value === '') || Number.isNaN(value as number)) {
      state.salePrice = null
    }
  }
)

watch(
  () => state.stock,
  (value) => {
    if (value === undefined || value === null) {
      return
    }

    if ((typeof value === 'string' && value === '') || Number.isNaN(value as number)) {
      state.stock = null
    }
  }
)

watch(
  () => state.seoCanonical,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    const normalizedSlugPath = normalizeSlugToPath(state.slug)
    if (!value) {
      canonicalFollowsSlug.value = !normalizedSlugPath
      return
    }

    canonicalFollowsSlug.value = value === normalizedSlugPath
  }
)

watch(
  () => state.seoTitle,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.seoTitle !== null && value !== lastGeneratedContent.seoTitle) {
      lastGeneratedContent.seoTitle = null
    }
  }
)

watch(
  () => state.seoDescription,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.seoDescription !== null && value !== lastGeneratedContent.seoDescription) {
      lastGeneratedContent.seoDescription = null
    }
  }
)

watch(
  () => state.seoKeywords.slice(),
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.seoKeywords && !arraysShallowEqualList(value, lastGeneratedContent.seoKeywords)) {
      lastGeneratedContent.seoKeywords = null
    }
  }
)

watch(
  () => [
    state.nameEn,
    state.nameAr,
    state.brandId,
    state.categoryId
  ],
  () => {
    maybeAutoUpdateSeo()
  }
)

watch(
  () => state.descriptionEn,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.descriptionEn !== null && value !== lastGeneratedContent.descriptionEn) {
      lastGeneratedContent.descriptionEn = null
    }
  }
)

watch(
  () => state.descriptionAr,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.descriptionAr !== null && value !== lastGeneratedContent.descriptionAr) {
      lastGeneratedContent.descriptionAr = null
    }
  }
)

watch(
  () => state.shortDescriptionEn,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.shortDescriptionEn !== null && value !== lastGeneratedContent.shortDescriptionEn) {
      lastGeneratedContent.shortDescriptionEn = null
    }
  }
)

watch(
  () => state.shortDescriptionAr,
  (value) => {
    if (isApplyingGeneratedSeo) {
      return
    }

    if (lastGeneratedContent.shortDescriptionAr !== null && value !== lastGeneratedContent.shortDescriptionAr) {
      lastGeneratedContent.shortDescriptionAr = null
    }
  }
)

function truncateText(value: string, max: number) {
  if (!value) {
    return ''
  }
  if (value.length <= max) {
    return value
  }

  const clipped = value.slice(0, max).trim()
  const lastSpace = clipped.lastIndexOf(' ')

  if (lastSpace > max * 0.6) {
    return clipped.slice(0, lastSpace).trim()
  }

  return clipped
}

function pickVariant<T>(options: T[], randomize: boolean) {
  if (!options.length) {
    return undefined
  }
  if (!randomize) {
    return options[0]
  }
  const index = Math.floor(Math.random() * options.length)
  return options[index]
}

function arraysShallowEqualList(a?: string[] | null, b?: string[] | null) {
  if (!a || !b) {
    return !a && !b
  }
  if (a.length !== b.length) {
    return false
  }
  return a.every((value, index) => value === b[index])
}

function generateSeoMetadata(randomize = false) {
  const name = state.nameEn.trim()
  const fallbackName = name || 'New Product'
  const brandName = getBrandName(state.brandId).trim()
  const categoryName = getCategoryName(state.categoryId).trim()
  const summarySource = state.shortDescriptionEn.trim() || state.descriptionEn.trim()

  const adjective = pickVariant(SEO_ADJECTIVES, randomize) ?? ''
  const hook = pickVariant(SEO_HOOKS, randomize) ?? ''
  const opener = pickVariant(SEO_OPENERS, randomize) ?? 'Discover'
  const closer = pickVariant(SEO_CLOSERS, randomize) ?? ''

  const headlineParts: string[] = []
  if (brandName) {
    headlineParts.push(`${brandName} ${fallbackName}`.trim())
  } else {
    const descriptor = `${adjective ? `${adjective} ` : ''}${fallbackName}`.trim()
    headlineParts.push(descriptor)
  }

  if (categoryName) {
    headlineParts.push(categoryName)
  }

  if (hook) {
    headlineParts.push(hook)
  }

  let title = truncateText(headlineParts.filter(Boolean).join(' | '), MAX_SEO_TITLE_LENGTH)
  if (!title) {
    title = truncateText(`${opener} ${fallbackName}`, MAX_SEO_TITLE_LENGTH)
  }

  const lead = brandName ? `${brandName} ${fallbackName}`.trim() : `${opener} ${fallbackName}`.trim()
  const summary = summarySource || (categoryName ? `Perfect for ${categoryName.toLowerCase()}.` : 'Designed to elevate your everyday experience.')
  const closerSentence = closer || 'Order now while supplies last.'

  let description = truncateText(`${lead} — ${summary} ${closerSentence}`.replace(/\s+/g, ' ').trim(), MAX_SEO_DESCRIPTION_LENGTH)
  if (!description) {
    description = truncateText(`${opener} ${fallbackName} today.`, MAX_SEO_DESCRIPTION_LENGTH)
  }

  const keywordSet = new Set<string>()
  const normalizedName = fallbackName

  keywordSet.add(normalizedName)
  keywordSet.add(`buy ${normalizedName}`)
  keywordSet.add(`${normalizedName} online`)

  if (brandName) {
    keywordSet.add(`${brandName} ${normalizedName}`.trim())
    keywordSet.add(`${brandName} deals`)
  }

  if (categoryName) {
    keywordSet.add(`${categoryName} ${normalizedName}`.trim())
    keywordSet.add(`${categoryName} shop`)
  }

  if (hook) {
    keywordSet.add(`${normalizedName} ${hook.toLowerCase()}`)
  }

  const keywords = Array.from(keywordSet)
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
    .map(keyword => truncateText(keyword, 60))
    .slice(0, MAX_SEO_KEYWORDS)

  return {
    title,
    description,
    keywords,
    canonical: normalizeSlugToPath(state.slug)
  }
}

function generateProductCopy(randomize = false) {
  const nameEn = state.nameEn.trim() || 'New Product'
  const nameAr = state.nameAr.trim() || nameEn
  const brandName = getBrandName(state.brandId).trim()
  const categoryName = getCategoryName(state.categoryId).trim()
  const summaryFallback = `${nameEn} ${categoryName ? `for ${categoryName.toLowerCase()}` : 'ready for daily use'}`
  const feature = pickVariant(COPY_FEATURES, randomize) ?? COPY_FEATURES[0]
  const hook = pickVariant(SEO_HOOKS, randomize) ?? SEO_HOOKS[0] ?? 'Shop Now'
  const opener = pickVariant(SEO_OPENERS, randomize) ?? SEO_OPENERS[0]
  const closer = pickVariant(SEO_CLOSERS, randomize) ?? SEO_CLOSERS[0]
  const arabicOpener = pickVariant(COPY_AR_OPENERS, randomize) ?? COPY_AR_OPENERS[0]
  const arabicHook = pickVariant(COPY_AR_HOOKS, randomize) ?? COPY_AR_HOOKS[0]
  const arabicCloser = pickVariant(COPY_AR_CLOSERS, randomize) ?? COPY_AR_CLOSERS[0]

  const englishIntroParts = [] as string[]
  if (brandName) {
    englishIntroParts.push(`${brandName} ${nameEn}`.trim())
  } else {
    englishIntroParts.push(`${opener} ${nameEn}`.trim())
  }

  if (categoryName) {
    englishIntroParts.push(`crafted for modern ${categoryName.toLowerCase()}`)
  }

  const englishBody = summaryFallback
  const englishClosing = `${feature}. ${closer}`

  const descriptionEn = truncateText(`${englishIntroParts.join(' — ')}. ${englishBody}. ${englishClosing}`.replace(/\s+/g, ' ').trim(), MAX_DESCRIPTION_LENGTH)
  const shortDescriptionEn = truncateText(`${nameEn} — ${hook.toLowerCase()}.`, MAX_SHORT_DESCRIPTION_LENGTH)

  const arabicNameFragment = brandName ? `${nameAr} by ${brandName}` : nameAr
  const categoryFragmentAr = categoryName ? `perfect for ${categoryName.toLowerCase()}` : 'designed for everyday use'
  const arabicBody = `${arabicNameFragment} combines quality and practical details to meet your needs.`
  const descriptionAr = truncateText(`${arabicOpener} ${arabicNameFragment}. ${arabicBody} ${categoryFragmentAr}. ${arabicCloser}`.replace(/\s+/g, ' ').trim(), MAX_DESCRIPTION_LENGTH)
  const shortDescriptionAr = truncateText(`${arabicNameFragment} with ${arabicHook} and reliable service.`, MAX_SHORT_DESCRIPTION_LENGTH)

  return {
    descriptionEn,
    descriptionAr,
    shortDescriptionEn,
    shortDescriptionAr
  }
}

function setSeoTitleFromGenerator(value: string, remember = true) {
  if (!value) {
    return
  }
  if (state.seoTitle === value) {
    if (remember) {
      lastGeneratedContent.seoTitle = value
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.seoTitle = value
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.seoTitle = value
  }
}

function setSeoDescriptionFromGenerator(value: string, remember = true) {
  if (!value) {
    return
  }
  if (state.seoDescription === value) {
    if (remember) {
      lastGeneratedContent.seoDescription = value
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.seoDescription = value
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.seoDescription = value
  }
}

function setSeoKeywordsFromGenerator(keywords: string[], remember = true) {
  if (!keywords.length) {
    return
  }
  if (arraysShallowEqualList(state.seoKeywords, keywords)) {
    if (remember) {
      lastGeneratedContent.seoKeywords = [...keywords]
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.seoKeywords = [...keywords]
  state.newSeoKeyword = ''
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.seoKeywords = [...keywords]
  }
}

function setDescriptionEnFromGenerator(value: string, remember = true) {
  if (!value) {
    return
  }

  if (state.descriptionEn === value) {
    if (remember) {
      lastGeneratedContent.descriptionEn = value
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.descriptionEn = value
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.descriptionEn = value
  }
}

function setDescriptionArFromGenerator(value: string, remember = true) {
  if (!value) {
    return
  }

  if (state.descriptionAr === value) {
    if (remember) {
      lastGeneratedContent.descriptionAr = value
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.descriptionAr = value
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.descriptionAr = value
  }
}

function setShortDescriptionEnFromGenerator(value: string, remember = true) {
  if (!value) {
    return
  }

  if (state.shortDescriptionEn === value) {
    if (remember) {
      lastGeneratedContent.shortDescriptionEn = value
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.shortDescriptionEn = value
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.shortDescriptionEn = value
  }
}

function setShortDescriptionArFromGenerator(value: string, remember = true) {
  if (!value) {
    return
  }

  if (state.shortDescriptionAr === value) {
    if (remember) {
      lastGeneratedContent.shortDescriptionAr = value
    }
    return
  }

  isApplyingGeneratedSeo = true
  state.shortDescriptionAr = value
  isApplyingGeneratedSeo = false

  if (remember) {
    lastGeneratedContent.shortDescriptionAr = value
  }
}

function setSeoCanonicalFromGenerator(value?: string | null, rememberAuto = true) {
  const normalized = normalizeSlugToPath(value || state.slug)

  if (!normalized) {
    return
  }

  if (state.seoCanonical === normalized) {
    canonicalFollowsSlug.value = rememberAuto && normalized === normalizeSlugToPath(state.slug)
    return
  }

  isApplyingGeneratedSeo = true
  state.seoCanonical = normalized
  isApplyingGeneratedSeo = false

  canonicalFollowsSlug.value = rememberAuto && normalized === normalizeSlugToPath(state.slug)
}

function maybeAutoUpdateSeo() {
  const generated = generateSeoMetadata(false)

  if (lastGeneratedContent.seoTitle && state.seoTitle === lastGeneratedContent.seoTitle && generated.title && generated.title !== state.seoTitle) {
    setSeoTitleFromGenerator(generated.title)
  }

  if (lastGeneratedContent.seoDescription && state.seoDescription === lastGeneratedContent.seoDescription && generated.description && generated.description !== state.seoDescription) {
    setSeoDescriptionFromGenerator(generated.description)
  }

  if (
    lastGeneratedContent.seoKeywords
    && arraysShallowEqualList(state.seoKeywords, lastGeneratedContent.seoKeywords)
    && generated.keywords.length
    && !arraysShallowEqualList(state.seoKeywords, generated.keywords)
  ) {
    setSeoKeywordsFromGenerator(generated.keywords)
  }

  if (canonicalFollowsSlug.value && generated.canonical) {
    setSeoCanonicalFromGenerator(generated.canonical, true)
  }
}

function populateSeoIfEmpty() {
  const generated = generateSeoMetadata(false)

  if (!state.seoTitle && generated.title) {
    setSeoTitleFromGenerator(generated.title)
  }

  if (!state.seoDescription && generated.description) {
    setSeoDescriptionFromGenerator(generated.description)
  }

  if (!state.seoKeywords.length && generated.keywords.length) {
    setSeoKeywordsFromGenerator(generated.keywords)
  }

  if (!state.seoCanonical && generated.canonical) {
    setSeoCanonicalFromGenerator(generated.canonical)
  }

  const copy = generateProductCopy(false)

  if (!state.descriptionEn && copy.descriptionEn) {
    setDescriptionEnFromGenerator(copy.descriptionEn)
  }

  if (!state.descriptionAr && copy.descriptionAr) {
    setDescriptionArFromGenerator(copy.descriptionAr)
  }

  if (!state.shortDescriptionEn && copy.shortDescriptionEn) {
    setShortDescriptionEnFromGenerator(copy.shortDescriptionEn)
  }

  if (!state.shortDescriptionAr && copy.shortDescriptionAr) {
    setShortDescriptionArFromGenerator(copy.shortDescriptionAr)
  }
}

type SeoTarget = 'title' | 'description' | 'keywords' | 'all' | 'descriptionEn' | 'descriptionAr' | 'shortDescriptionEn' | 'shortDescriptionAr' | 'descriptions' | 'shortDescriptions'

interface SeoServicePayload {
  name: string
  nameAr?: string
  brand?: string
  category?: string
  description?: string
  descriptionAr?: string
  shortDescription?: string
  shortDescriptionAr?: string
  slug?: string
  keywords?: string[]
  randomize: boolean
}

interface SeoServiceResult {
  title?: string
  description?: string
  keywords?: string[]
  keywordsAr?: string[]
  canonical?: string
  descriptionEn?: string
  descriptionAr?: string
  shortDescriptionEn?: string
  shortDescriptionAr?: string
}

interface SeoServiceResponse {
  result?: SeoServiceResult
  error?: string
}

function buildSeoRequestPayload(randomize: boolean) {
  const payload: SeoServicePayload = {
    name: state.nameEn.trim(),
    nameAr: state.nameAr.trim(),
    brand: getBrandName(state.brandId).trim(),
    category: getCategoryName(state.categoryId).trim(),
    description: state.descriptionEn.trim(),
    descriptionAr: state.descriptionAr.trim(),
    shortDescription: state.shortDescriptionEn.trim(),
    shortDescriptionAr: state.shortDescriptionAr.trim(),
    slug: state.slug.trim(),
    keywords: [...state.seoKeywords],
    randomize
  }

  return payload
}

async function regenerateSeo(target: SeoTarget, randomize = true) {
  const loadingKey = (target === 'all' ? 'all' : target) as GenerationLoadingKey

  if (generationLoading[loadingKey]) {
    return
  }

  const nameEn = state.nameEn.trim()
  const brandName = getBrandName(state.brandId).trim()
  const categoryName = getCategoryName(state.categoryId).trim()

  if (!nameEn || !brandName || !categoryName) {
    generationErrorMessage.value = 'Provide English name, brand, and category before generating content.'
    return
  }

  generationLoading[loadingKey] = true
  generationErrorMessage.value = null

  if (contentAbortController) {
    contentAbortController.abort()
  }

  const controller = new AbortController()
  contentAbortController = controller

  const payload = buildSeoRequestPayload(randomize)

  try {
    const response = await fetch('/api/seo/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...payload, target }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error('Unable to reach SEO generator')
    }

    const data: SeoServiceResponse = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    const result = data.result

    const fallbackSeo = generateSeoMetadata(randomize)
    const fallbackCopy = generateProductCopy(randomize)

    if ((target === 'title' || target === 'all') && (result?.title || fallbackSeo.title)) {
      setSeoTitleFromGenerator(result?.title ?? fallbackSeo.title)
    }

    if ((target === 'description' || target === 'all') && (result?.description || fallbackSeo.description)) {
      setSeoDescriptionFromGenerator(result?.description ?? fallbackSeo.description)
    }

    if ((target === 'keywords' || target === 'all') && ((result?.keywords?.length ?? 0) || fallbackSeo.keywords.length)) {
      setSeoKeywordsFromGenerator(result?.keywords?.length ? result.keywords : fallbackSeo.keywords)
    }

    if ((target === 'descriptionEn' || target === 'descriptions') && (result?.descriptionEn || fallbackCopy.descriptionEn)) {
      setDescriptionEnFromGenerator(result?.descriptionEn ?? fallbackCopy.descriptionEn)
    }

    if ((target === 'descriptionAr' || target === 'descriptions') && (result?.descriptionAr || fallbackCopy.descriptionAr)) {
      setDescriptionArFromGenerator(result?.descriptionAr ?? fallbackCopy.descriptionAr)
    }

    if ((target === 'shortDescriptionEn' || target === 'shortDescriptions') && (result?.shortDescriptionEn || fallbackCopy.shortDescriptionEn)) {
      setShortDescriptionEnFromGenerator(result?.shortDescriptionEn ?? fallbackCopy.shortDescriptionEn)
    }

    if ((target === 'shortDescriptionAr' || target === 'shortDescriptions') && (result?.shortDescriptionAr || fallbackCopy.shortDescriptionAr)) {
      setShortDescriptionArFromGenerator(result?.shortDescriptionAr ?? fallbackCopy.shortDescriptionAr)
    }

    if (target === 'all' && (result?.canonical || fallbackSeo.canonical)) {
      setSeoCanonicalFromGenerator(result?.canonical ?? fallbackSeo.canonical, true)
    }
  } catch (error) {
    if (controller.signal.aborted) {
      return
    }

    generationErrorMessage.value = error instanceof Error ? error.message : 'Failed to generate content'

    const fallbackSeo = generateSeoMetadata(randomize)
    const fallbackCopy = generateProductCopy(randomize)

    if (target === 'title' || target === 'all') {
      setSeoTitleFromGenerator(fallbackSeo.title)
    }

    if (target === 'description' || target === 'all') {
      setSeoDescriptionFromGenerator(fallbackSeo.description)
    }

    if (target === 'keywords' || target === 'all') {
      setSeoKeywordsFromGenerator(fallbackSeo.keywords)
    }

    if (target === 'descriptionEn' || target === 'descriptions') {
      setDescriptionEnFromGenerator(fallbackCopy.descriptionEn)
    }

    if (target === 'descriptionAr' || target === 'descriptions') {
      setDescriptionArFromGenerator(fallbackCopy.descriptionAr)
    }

    if (target === 'shortDescriptionEn' || target === 'shortDescriptions') {
      setShortDescriptionEnFromGenerator(fallbackCopy.shortDescriptionEn)
    }

    if (target === 'shortDescriptionAr' || target === 'shortDescriptions') {
      setShortDescriptionArFromGenerator(fallbackCopy.shortDescriptionAr)
    }

    if (target === 'all') {
      setSeoCanonicalFromGenerator(fallbackSeo.canonical, true)
    }
  } finally {
    if (contentAbortController === controller) {
      generationLoading[loadingKey] = false
      contentAbortController = null
    }
  }
}

function handleRegenerateSeo(target: SeoTarget, randomize = true) {
  void regenerateSeo(target, randomize)
}

function handleRegenerateDescriptions(randomize = true) {
  if (generationLoading.descriptions || generationLoading.shortDescriptions) {
    return
  }
  handleRegenerateSeo('descriptions', randomize)
  handleRegenerateSeo('shortDescriptions', randomize)
}

function openCategoryCreator() {
  emit('open-category-create')
}

function addSeoKeywords(rawInput: string) {
  const incoming = rawInput
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)

  if (!incoming.length) {
    state.newSeoKeyword = ''
    return
  }

  const existingLower = state.seoKeywords.map((keyword: string) => keyword.toLowerCase())

  for (const keyword of incoming) {
    if (state.seoKeywords.length >= MAX_SEO_KEYWORDS) {
      break
    }

    const lower = keyword.toLowerCase()
    if (existingLower.includes(lower)) {
      continue
    }

    state.seoKeywords.push(keyword)
    existingLower.push(lower)
  }

  state.newSeoKeyword = ''
}

function removeSeoKeyword(keyword: string) {
  const index = state.seoKeywords.findIndex((current: string) => current === keyword)
  if (index !== -1) {
    state.seoKeywords.splice(index, 1)
  }
}

function handleSeoKeywordKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addSeoKeywords(state.newSeoKeyword)
  }
}

function handleSeoKeywordBlur() {
  addSeoKeywords(state.newSeoKeyword)
}

function regenerateSlug() {
  state.slug = slugify(state.nameEn)
  hasManuallyEditedSlug.value = false
}

function toProductPayload(): ProductBasePayload {
  const salePrice = typeof state.salePrice === 'number' && !salePriceInvalid.value && state.salePrice > 0
    ? state.salePrice
    : null

  return {
    nameEn: state.nameEn.trim(),
    nameAr: state.nameAr.trim(),
    price: state.price,
    salePrice,
    quantity: state.quantity,
    categoryId: state.categoryId ?? null,
    brandId: state.brandId ?? null
  }
}

function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  void event
  emit('submit', toProductPayload())
}

function setCategoryId(id: number | null) {
  state.categoryId = id ?? null
}

function setBrandId(id: number | null) {
  state.brandId = id ?? null
}

if (shouldAutoPopulateSeo.value) {
  populateSeoIfEmpty()
}

defineExpose({
  setCategoryId,
  setBrandId
})
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-8 relative"
    @submit="onSubmit"
  >
    <div class="grid gap-y-8 gap-x-6   xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div class="space-y-10">
        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-medium text-highlighted">
              General details
            </h2>
            <p class="text-sm text-muted">
              Names and slug used across the storefront.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField :label="requiredLabel('Product name')" name="nameEn">
              <UInput
                v-model="state.nameEn"
                placeholder="Awesome product"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Product name (Arabic)" name="nameAr" dir="rtl">
              <UInput
                v-model="state.nameAr"
                placeholder="Product name in Arabic"
                class="w-full"
                dir="rtl"
              />
            </UFormField>
          </div>

          <UFormField :help="slugHelp" label="Slug" name="slug">
            <div class="flex gap-2">
              <UInput
                v-model="state.slug"
                :placeholder="suggestedSlug || 'auto-generated-slug'"
                class="flex-1"
              />
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-lucide-refresh-ccw"
                @click.prevent="regenerateSlug"
              />
            </div>
          </UFormField>
        </section>

        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-medium text-highlighted">
              Classification
            </h2>
            <p class="text-sm text-muted">
              Associate the product to improve navigation.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField name="categoryId">
              <template #label>
                <div class="flex items-center justify-between text-sm font-medium text-highlighted">
                  <span class="flex items-center gap-1">
                    <span>Category</span>
                    <span class="text-error" aria-hidden="true">*</span>
                  </span>
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="primary"
                    icon="i-lucide-plus"
                    class="-mb-1"
                    @click.prevent="openCategoryCreator"
                  >
                    Add
                  </UButton>
                </div>
              </template>
              <USelect
                v-model="state.categoryId"
                :items="categoryItems"
                class="w-full"
              />
            </UFormField>

            <UFormField name="brandId">
              <template #label>
                <div class="flex items-center justify-between text-sm font-medium text-highlighted">
                  <span class="flex items-center gap-1">
                    <span>Brand</span>
                    <span class="text-error" aria-hidden="true">*</span>
                  </span>
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="primary"
                    icon="i-lucide-plus"
                    class="-mb-1"
                    @click.prevent="emit('open-brand-create')"
                  >
                    Add
                  </UButton>
                </div>
              </template>
              <USelect
                v-model="state.brandId"
                :items="brandItems"
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="text-lg font-medium text-highlighted">
                Basic info
              </h2>
              <p class="text-sm text-muted">
                Generate and refine core product descriptions in both languages.
              </p>
            </div>
            <UButton
              variant="ghost"
              color="primary"

              icon="i-lucide-sparkles"
              class="shrink-0"
              :loading="generationLoading.descriptions || generationLoading.shortDescriptions"
              :disabled="generationLoading.descriptions || generationLoading.shortDescriptions"
              aria-label="Regenerate basic product info"
              @click.prevent="handleRegenerateDescriptions()"
            >
              <span class="hidden sm:inline">Regenerate basic info</span>
            </UButton>
          </div>

          <UFormField :help="`${descriptionEnLength}/${MAX_DESCRIPTION_LENGTH} characters`" label="Description (English)" name="descriptionEn">
            <UTextarea
              v-model="state.descriptionEn"
              placeholder="Full product description"
              :rows="6"
              class="w-full"
            />
          </UFormField>

          <UFormField :help="`${descriptionArLength}/${MAX_DESCRIPTION_LENGTH} characters`" label="Description (Arabic)" name="descriptionAr">
            <UTextarea
              v-model="state.descriptionAr"
              placeholder="Product description in Arabic"
              :rows="6"
              class="w-full"
            />
          </UFormField>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField :help="`${shortDescriptionEnLength}/${MAX_SHORT_DESCRIPTION_LENGTH} characters`" label="Short description" name="shortDescriptionEn">
              <UTextarea
                v-model="state.shortDescriptionEn"
                placeholder="Quick summary shown in listings"
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :help="`${shortDescriptionArLength}/${MAX_SHORT_DESCRIPTION_LENGTH} characters`"
              label="Short description (Arabic)"
              name="shortDescriptionAr"
              dir="rtl"
            >
              <UTextarea
                v-model="state.shortDescriptionAr"
                placeholder="Short product summary in Arabic"
                :rows="3"
                dir="rtl"
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-medium text-highlighted">
              Media
            </h2>
            <p class="text-sm text-muted">
              Upload product images in the desired order.
            </p>
          </div>

          <UFormField name="images">
            <template #label>
              <div class="flex items-center justify-between text-sm font-medium text-highlighted">
                <span>Product gallery</span>
                <span class="text-xs text-muted">First image becomes the storefront thumbnail.</span>
              </div>
            </template>
            <S3ImageUploader
              v-model="state.images"
              placeholder-class="text-sm text-muted max-w-2xl"
            />
          </UFormField>
        </section>

        <section class="space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="text-lg font-medium text-highlighted">
                Meta tags
              </h2>
              <p class="text-sm text-muted">
                Generate SEO title, description, canonical, and keywords.
              </p>
            </div>
            <UButton
              variant="ghost"
              color="primary"

              icon="i-lucide-sparkles"
              class="shrink-0"
              :loading="generationLoading.all"
              aria-label="Regenerate meta tags"
              @click.prevent="handleRegenerateSeo('all')"
            >
              <span class="hidden sm:inline">Regenerate meta tags</span>
            </UButton>
          </div>

          <UAlert
            v-if="generationErrorMessage"
            color="warning"
            variant="soft"
            :title="generationErrorMessage"
            class="text-sm"
          />

          <UFormField :help="`${seoTitleLength}/${MAX_SEO_TITLE_LENGTH} characters`" label="SEO title" name="seoTitle">
            <UInput
              v-model="state.seoTitle"
              placeholder="Title shown in search results"
              class="w-full"
            />
          </UFormField>

          <UFormField :help="`${seoDescriptionLength}/${MAX_SEO_DESCRIPTION_LENGTH} characters`" label="SEO description" name="seoDescription">
            <UTextarea
              v-model="state.seoDescription"
              placeholder="Short summary displayed on search engines"
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Canonical URL" name="seoCanonical">
            <UInput
              v-model="state.seoCanonical"
              placeholder="https://example.com/products/product-slug"
              class="w-full"
            />
          </UFormField>

          <UFormField :help="seoKeywordHelp" name="seoKeywords">
            <template #label>
              <div class="flex items-center justify-between text-sm font-medium text-highlighted">
                <span>SEO keywords</span>
              </div>
            </template>
            <div class="space-y-3">
              <UInput
                v-model="state.newSeoKeyword"
                placeholder="Press enter or comma to add keywords"
                class="w-full"
                @keydown="handleSeoKeywordKeydown"
                @blur="handleSeoKeywordBlur"
              />

              <div v-if="state.seoKeywords.length" class="flex flex-wrap gap-2">
                <span
                  v-for="keyword in state.seoKeywords"
                  :key="keyword"
                  class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-highlighted"
                >
                  <span>{{ keyword }}</span>
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-x"
                    class="-mr-2"
                    @click.prevent="removeSeoKeyword(keyword)"
                  />
                </span>
              </div>

              <p v-else class="text-xs text-muted">
                Add up to {{ MAX_SEO_KEYWORDS }} keywords.
              </p>
            </div>
          </UFormField>
        </section>

        <!-- Bilingual SEO Section -->
        <section class="space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="text-lg font-medium text-highlighted">
                Bilingual SEO
              </h2>
              <p class="text-sm text-muted">
                Per-language meta tags for English and Arabic storefronts.
              </p>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              :icon="showBilingualSeo ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              @click="showBilingualSeo = !showBilingualSeo"
            >
              {{ showBilingualSeo ? 'Hide' : 'Show' }}
            </UButton>
          </div>

          <div
            v-show="showBilingualSeo"
            class="space-y-4"
          >
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField
                label="Meta Title (EN)"
                name="seoTitleEn"
                :hint="`${(state.seoTitleEn || '').length}/70`"
              >
                <UInput
                  v-model="state.seoTitleEn"
                  placeholder="Page title for search engines"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Meta Title (AR)"
                name="seoTitleAr"
                :hint="`${(state.seoTitleAr || '').length}/70`"
              >
                <UInput
                  v-model="state.seoTitleAr"
                  placeholder="Page title for search engines in Arabic"
                  dir="rtl"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField
                label="Meta Description (EN)"
                name="seoDescriptionEn"
                :hint="`${(state.seoDescriptionEn || '').length}/160`"
              >
                <UTextarea
                  v-model="state.seoDescriptionEn"
                  placeholder="Description for search engines"
                  :rows="2"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Meta Description (AR)"
                name="seoDescriptionAr"
                :hint="`${(state.seoDescriptionAr || '').length}/160`"
              >
                <UTextarea
                  v-model="state.seoDescriptionAr"
                  placeholder="Description for search engines in Arabic"
                  :rows="2"
                  dir="rtl"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField
                label="Meta Keywords (EN)"
                name="seoKeywordsEn"
              >
                <UInput
                  v-model="state.seoKeywordsEn"
                  placeholder="keyword1, keyword2, keyword3"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Meta Keywords (AR)"
                name="seoKeywordsAr"
              >
                <UInput
                  v-model="state.seoKeywordsAr"
                  placeholder="keyword1, keyword2, keyword3"
                  dir="rtl"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UDivider label="Open Graph" />

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField
                label="OG Title (EN)"
                name="ogTitleEn"
              >
                <UInput
                  v-model="state.ogTitleEn"
                  placeholder="Title for social sharing"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="OG Title (AR)"
                name="ogTitleAr"
              >
                <UInput
                  v-model="state.ogTitleAr"
                  placeholder="Title for social sharing in Arabic"
                  dir="rtl"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField
                label="OG Description (EN)"
                name="ogDescriptionEn"
              >
                <UTextarea
                  v-model="state.ogDescriptionEn"
                  placeholder="Description for social sharing"
                  :rows="2"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="OG Description (AR)"
                name="ogDescriptionAr"
              >
                <UTextarea
                  v-model="state.ogDescriptionAr"
                  placeholder="Description for social sharing in Arabic"
                  :rows="2"
                  dir="rtl"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </section>
      </div>

      <div class="xl:ring xl:p-6 ring-default xl:self-start rounded-2xl xl:sticky xl:top-8">
        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-medium text-highlighted">
              Pricing &amp; inventory
            </h2>
            <p class="text-sm text-muted">
              Set pricing and manage stock levels.
            </p>
          </div>

          <UFormField :label="requiredLabel('Price')" name="price">
            <UInput
              v-model.number="state.price"
              type="number"
              min="0"
              step="0.01"
              class="w-full"
            />
          </UFormField>

          <UFormField :help="salePriceHelp" label="Sale price" name="salePrice">
            <UInput
              v-model.number="state.salePrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional discounted price"
              class="w-full"
            />
          </UFormField>

          <div class="grid gap-4 ">
            <UFormField :label="requiredLabel('Quantity')" name="quantity">
              <UInput
                v-model.number="state.quantity"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>

            <UFormField
              help="Leave empty to follow available quantity"
              label="Stock override"
              name="stock"
              :required="false"
            >
              <UInput
                v-model.number="state.stock"
                type="number"
                min="0"
                class="w-full"
                placeholder="Defaults to quantity"
              />
            </UFormField>
          </div>
        </section>

        <section class="space-y-2 mt-8">
          <h2 class="text-lg font-medium text-highlighted">
            Publishing
          </h2>

          <UFormField name="isArchived" class="flex gap-2 item-center" label="Archive product">
            <USwitch v-model="state.isArchived" class="-mt-1.5" size="xl" />
          </UFormField>
          <p class="text-xs text-muted flex items-center">
            <Icon name="i-lucide-info" class="mr-1" />
            Archived products stay hidden from the storefront.
          </p>
        </section>
      </div>
    </div>

    <div class="flex justify-end ">
      <UButton
        type="submit"
        size="lg"
        :label="submitLabel"
        icon="i-lucide-save"
        :loading="props.loading"
      />
    </div>
  </UForm>
</template>
