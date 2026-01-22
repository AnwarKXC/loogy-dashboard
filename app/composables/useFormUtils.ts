import { ref, computed } from 'vue'
import { z } from 'zod'

/**
 * Common validation patterns for e-commerce forms
 */
export const formValidators = {
  // Required string with min/max length
  requiredString: (min = 1, max = 255) =>
    z.string().trim().min(min, 'This field is required').max(max, `Maximum ${max} characters`),

  // Optional string with max length
  optionalString: (max = 255) =>
    z.string().trim().max(max, `Maximum ${max} characters`).optional().or(z.literal('')),

  // Email validation
  email: () =>
    z.string().email('Enter a valid email address'),

  // Password with configurable min length
  password: (min = 8) =>
    z.string().min(min, `Password must be at least ${min} characters`),

  // Price/money field (positive number, 2 decimal places)
  price: () =>
    z.coerce.number().min(0, 'Price must be 0 or greater'),

  // Optional price field (allows null)
  optionalPrice: () =>
    z.preprocess(
      val => (val === '' || val === null || val === undefined ? null : val),
      z.number().min(0).nullable()
    ).optional(),

  // Quantity/stock field (positive integer)
  quantity: () =>
    z.coerce.number().int().min(0, 'Quantity cannot be negative'),

  // Optional quantity field
  optionalQuantity: () =>
    z.preprocess(
      val => (val === '' || val === null || val === undefined ? null : val),
      z.number().int().min(0).nullable()
    ).optional(),

  // ID field (positive integer, nullable for "no selection")
  selectId: () =>
    z.coerce.number().int().positive().nullable().optional(),

  // URL validation (optional)
  url: () =>
    z.string().url('Enter a valid URL').optional().or(z.literal('')),

  // Slug validation
  slug: (max = 120) =>
    z.string()
      .trim()
      .max(max, `Slug must be under ${max} characters`)
      .regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .optional(),

  // Phone number (basic validation)
  phone: () =>
    z.string()
      .trim()
      .regex(/^[+]?[\d\s()-]{7,20}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),

  // SEO title (with character limit)
  seoTitle: (max = 70) =>
    z.string().trim().max(max, `SEO title is too long (max ${max} chars)`).optional(),

  // SEO description (with character limit)
  seoDescription: (max = 160) =>
    z.string().trim().max(max, `SEO description is too long (max ${max} chars)`).optional(),

  // Keywords (comma-separated or array)
  seoKeywords: (maxItems = 15) =>
    z.array(z.string().trim().max(60)).max(maxItems).default([]),

  // Image URL array
  images: () =>
    z.array(z.string().trim()).default([])
}

/**
 * Common bilingual field schema builder
 */
export function bilingualField(validator: z.ZodTypeAny = z.string().trim().optional()) {
  return z.object({
    en: validator,
    ar: validator
  })
}

/**
 * Create a bilingual SEO fields schema
 */
export function createBilingualSeoSchema() {
  return {
    seoTitleEn: formValidators.seoTitle(),
    seoTitleAr: formValidators.seoTitle(),
    seoDescriptionEn: formValidators.seoDescription(),
    seoDescriptionAr: formValidators.seoDescription(),
    seoKeywordsEn: z.string().trim().max(255).optional(),
    seoKeywordsAr: z.string().trim().max(255).optional(),
    ogTitleEn: formValidators.seoTitle(),
    ogTitleAr: formValidators.seoTitle(),
    ogDescriptionEn: z.string().trim().max(200).optional(),
    ogDescriptionAr: z.string().trim().max(200).optional()
  }
}

/**
 * Composable for managing form submission state
 */
export function useFormSubmission<T>() {
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  async function handleSubmit(
    submitFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | null> {
    if (isSubmitting.value) return null

    isSubmitting.value = true
    submitError.value = null

    try {
      const result = await submitFn()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      submitError.value = message
      options?.onError?.(error instanceof Error ? error : new Error(message))
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  function clearError() {
    submitError.value = null
  }

  return {
    isSubmitting: computed(() => isSubmitting.value),
    submitError: computed(() => submitError.value),
    handleSubmit,
    clearError
  }
}

/**
 * Utility to create slug from text
 */
export function slugify(value: string, maxLength = 120): string {
  return value
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, maxLength)
}

/**
 * Utility to format currency for EGP
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Utility to parse error messages from API responses
 */
export function parseApiError(error: unknown): string {
  if (error && typeof error === 'object') {
    // Handle ofetch FetchError
    if ('data' in error) {
      const data = (error as { data?: { message?: string, statusMessage?: string } }).data
      if (data?.statusMessage) return data.statusMessage
      if (data?.message) return data.message
    }

    // Handle standard Error
    if ('message' in error && typeof (error as Error).message === 'string') {
      return (error as Error).message
    }
  }

  return 'An unexpected error occurred'
}

/**
 * Composable for managing field character counts
 */
export function useCharacterCount(maxLength: number) {
  const content = ref('')

  const count = computed(() => content.value.trim().length)
  const remaining = computed(() => Math.max(0, maxLength - count.value))
  const isOverLimit = computed(() => count.value > maxLength)
  const hint = computed(() => `${count.value}/${maxLength}`)

  return {
    content,
    count,
    remaining,
    isOverLimit,
    hint
  }
}

/**
 * Composable for managing tag/keyword inputs
 */
export function useTagInput(maxItems = 15, maxItemLength = 60) {
  const tags = ref<string[]>([])
  const inputValue = ref('')

  function addTag(value: string) {
    const trimmed = value.trim().slice(0, maxItemLength)
    if (!trimmed) return false

    const lowerTags = tags.value.map(t => t.toLowerCase())
    if (lowerTags.includes(trimmed.toLowerCase())) return false

    if (tags.value.length >= maxItems) return false

    tags.value.push(trimmed)
    inputValue.value = ''
    return true
  }

  function addTags(rawInput: string) {
    const incoming = rawInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    for (const tag of incoming) {
      if (tags.value.length >= maxItems) break
      addTag(tag)
    }

    inputValue.value = ''
  }

  function removeTag(tag: string) {
    const index = tags.value.indexOf(tag)
    if (index !== -1) {
      tags.value.splice(index, 1)
    }
  }

  function clearTags() {
    tags.value = []
  }

  const canAddMore = computed(() => tags.value.length < maxItems)
  const remainingSlots = computed(() => Math.max(0, maxItems - tags.value.length))

  return {
    tags,
    inputValue,
    addTag,
    addTags,
    removeTag,
    clearTags,
    canAddMore,
    remainingSlots
  }
}

/**
 * Composable for form dirty state tracking
 */
export function useFormDirty<T extends Record<string, unknown>>(initialState: T) {
  const originalState = ref({ ...initialState }) as Ref<T>
  const currentState = ref({ ...initialState }) as Ref<T>

  const isDirty = computed(() => {
    return JSON.stringify(originalState.value) !== JSON.stringify(currentState.value)
  })

  function resetToOriginal() {
    currentState.value = { ...originalState.value }
  }

  function updateOriginal(newState: T) {
    originalState.value = { ...newState }
    currentState.value = { ...newState }
  }

  return {
    state: currentState,
    isDirty,
    resetToOriginal,
    updateOriginal
  }
}
