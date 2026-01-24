<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { PromoCodeEditorValues, PromoCodeApplicationType, PromoCodeScope, ProductAvailabilityType } from '~/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialValues?: Partial<PromoCodeEditorValues>
  submitting?: boolean
  open?: boolean
}>()

const emit = defineEmits<{ (e: 'submit', values: PromoCodeEditorValues): void }>()

// Helper to format Date to datetime-local string
function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper to parse datetime-local string to Date
function parseDateFromInput(value: string): Date | null {
  if (!value) return null
  return new Date(value)
}

const schema = z.object({
  code: z.string().trim()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be 50 characters or fewer')
    .regex(/^[A-Z0-9_-]+$/i, 'Only letters, numbers, hyphens, and underscores allowed')
    .transform(val => val.toUpperCase()),
  applicationType: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive('Value must be greater than 0'),
  usageLimit: z.coerce.number().int().min(1).optional().nullable()
    .or(z.literal('').transform(() => null)),
  isActive: z.boolean(),
  scope: z.enum(['GLOBAL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_PRODUCT_TYPES']).default('GLOBAL'),
  applicableAvailabilityTypes: z.array(z.enum(['IN_STOCK_EGYPT', 'ARRIVING_SOON', 'PRE_ORDER'])).optional(),
  applicableProductIds: z.array(z.number()).optional()
}).refine((data) => {
  if (data.applicationType === 'PERCENTAGE' && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'Percentage cannot exceed 100%',
  path: ['value']
}).refine((data) => {
  if (data.scope === 'SPECIFIC_PRODUCT_TYPES' && (!data.applicableAvailabilityTypes || data.applicableAvailabilityTypes.length === 0)) return false
  if (data.scope === 'SPECIFIC_PRODUCTS' && (!data.applicableProductIds || data.applicableProductIds.length === 0)) return false
  return true
}, {
  message: 'Please select at least one item',
  path: ['scope']
})

type FormState = z.infer<typeof schema>

const state = reactive<FormState>({
  code: props.initialValues?.code ?? '',
  applicationType: props.initialValues?.applicationType ?? 'PERCENTAGE',
  value: props.initialValues?.value ?? 10,
  usageLimit: props.initialValues?.usageLimit ?? null,
  isActive: props.initialValues?.isActive ?? true,
  scope: props.initialValues?.scope ?? 'GLOBAL',
  applicableAvailabilityTypes: props.initialValues?.applicableAvailabilityTypes ?? [],
  applicableProductIds: props.initialValues?.applicableProductIds ?? []
})

// Separate refs for date inputs (strings for HTML input compatibility)
const validFromStr = ref(formatDateForInput(props.initialValues?.validFrom))
const validToStr = ref(formatDateForInput(props.initialValues?.validTo))

const applicationTypeOptions = [
  { label: 'Percentage (%)', value: 'PERCENTAGE' as PromoCodeApplicationType },
  { label: 'Fixed Amount', value: 'FIXED' as PromoCodeApplicationType }
]

const valueLabel = computed(() => {
  return state.applicationType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'
})

const valuePlaceholder = computed(() => {
  return state.applicationType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 50'
})

const scopeOptions = [
  { label: 'All Products (Global)', value: 'GLOBAL' as PromoCodeScope },
  { label: 'Specific Product Types', value: 'SPECIFIC_PRODUCT_TYPES' as PromoCodeScope },
  { label: 'Specific Products', value: 'SPECIFIC_PRODUCTS' as PromoCodeScope }
]

const availabilityTypeOptions = [
  { label: 'In Stock (Egypt)', value: 'IN_STOCK_EGYPT' as ProductAvailabilityType },
  { label: 'Arriving Soon', value: 'ARRIVING_SOON' as ProductAvailabilityType },
  { label: 'Pre-Order', value: 'PRE_ORDER' as ProductAvailabilityType }
]

const loadingProducts = ref(false)
const allProducts = ref<{ id: number, label: string, labelAr: string, slug: string }[]>([])
const productSearchQuery = ref('')

interface MinimalProduct {
  id: number
  slug: string
  nameEn: string
  nameAr: string
}

// Fetch all products once (minimal endpoint)
async function fetchAllProducts() {
  if (allProducts.value.length > 0) return // Already loaded
  loadingProducts.value = true
  try {
    const response = await $fetch<MinimalProduct[]>('/api/products/list-minimal')
    allProducts.value = response.map(p => ({
      id: p.id,
      label: p.nameEn || p.slug || `Product #${p.id}`,
      labelAr: p.nameAr || p.nameEn || p.slug || `Product #${p.id}`,
      slug: p.slug
    }))
  } catch (e) {
    console.error('Failed to fetch products', e)
    allProducts.value = []
  } finally {
    loadingProducts.value = false
  }
}

// Filtered products based on search query (client-side)
const filteredProducts = computed(() => {
  const query = productSearchQuery.value.toLowerCase().trim()
  if (!query) return allProducts.value
  return allProducts.value.filter(p =>
    p.label.toLowerCase().includes(query)
    || p.labelAr.includes(query)
    || p.slug.toLowerCase().includes(query)
  )
})

// Load products when switching to SPECIFIC_PRODUCTS scope
watch(() => state.scope, async (newScope) => {
  if (newScope === 'SPECIFIC_PRODUCTS') {
    await fetchAllProducts()
  }
}, { immediate: true })

// Handle search input (client-side filtering)
function onProductSearch(query: string) {
  productSearchQuery.value = query
}

// Computed for selected products as objects (for USelectMenu)
const selectedProductObjects = computed(() => {
  const ids = state.applicableProductIds || []
  return allProducts.value.filter(p => ids.includes(p.id))
})

// Add a single product to the selection
function addProduct(product: { id: number, label: string } | null) {
  if (!product) return
  const current = state.applicableProductIds || []
  if (!current.includes(product.id)) {
    state.applicableProductIds = [...current, product.id]
  }
}

// Remove a product from the selection
function removeProduct(productId: number) {
  const current = state.applicableProductIds || []
  state.applicableProductIds = current.filter(id => id !== productId)
}

// Handler for checkbox group
function isAvailabilityTypeSelected(val: ProductAvailabilityType): boolean {
  return state.applicableAvailabilityTypes?.includes(val) ?? false
}

function toggleAvailabilityType(val: ProductAvailabilityType) {
  const current = state.applicableAvailabilityTypes || []
  if (current.includes(val)) {
    state.applicableAvailabilityTypes = current.filter(t => t !== val)
  } else {
    state.applicableAvailabilityTypes = [...current, val]
  }
}

// Validate date range
const dateError = computed(() => {
  const from = parseDateFromInput(validFromStr.value)
  const to = parseDateFromInput(validToStr.value)
  if (from && to && to <= from) {
    return 'End date must be after start date'
  }
  return null
})

watch(
  () => props.initialValues,
  (next) => {
    if (!next) return
    Object.assign(state, {
      code: next.code ?? '',
      applicationType: next.applicationType ?? 'PERCENTAGE',
      value: next.value ?? 10,
      usageLimit: next.usageLimit ?? null,
      isActive: next.isActive ?? true,
      scope: next.scope ?? 'GLOBAL',
      applicableAvailabilityTypes: next.applicableAvailabilityTypes ?? [],
      applicableProductIds: next.applicableProductIds ?? []
    })
    validFromStr.value = formatDateForInput(next.validFrom)
    validToStr.value = formatDateForInput(next.validTo)
  },
  { deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (open && props.mode === 'create') resetState()
    if (!open && !props.submitting) resetState()
  }
)

function resetState() {
  Object.assign(state, {
    code: props.initialValues?.code ?? '',
    applicationType: props.initialValues?.applicationType ?? 'PERCENTAGE',
    value: props.initialValues?.value ?? 10,
    usageLimit: props.initialValues?.usageLimit ?? null,
    isActive: props.initialValues?.isActive ?? true,
    scope: props.initialValues?.scope ?? 'GLOBAL',
    applicableAvailabilityTypes: props.initialValues?.applicableAvailabilityTypes ?? [],
    applicableProductIds: props.initialValues?.applicableProductIds ?? []
  })
  validFromStr.value = formatDateForInput(props.initialValues?.validFrom)
  validToStr.value = formatDateForInput(props.initialValues?.validTo)
}

function handleSubmit(_event: FormSubmitEvent<FormState>) {
  // Validate dates before submitting
  if (dateError.value) {
    return
  }

  const payload: PromoCodeEditorValues = {
    code: state.code.toUpperCase(),
    applicationType: state.applicationType,
    value: state.value,
    validFrom: parseDateFromInput(validFromStr.value),
    validTo: parseDateFromInput(validToStr.value),
    usageLimit: state.usageLimit || null,
    isActive: state.isActive,
    scope: state.scope,
    applicableAvailabilityTypes: state.applicableAvailabilityTypes ?? [],
    applicableProductIds: state.applicableProductIds ?? []
  }

  emit('submit', payload)
}

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  state.code = code
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-5"
    @submit="handleSubmit"
  >
    <!-- Code Field -->
    <UFormField label="Promo Code" name="code" required>
      <div class="flex gap-2">
        <UInput
          v-model="state.code"
          placeholder="e.g. SUMMER2026"
          class="flex-1 uppercase"
          :disabled="mode === 'edit'"
        />
        <UButton
          v-if="mode === 'create'"
          icon="i-lucide-sparkles"
          color="neutral"
          variant="outline"
          @click="generateRandomCode"
        >
          Generate
        </UButton>
      </div>
      <template #hint>
        <span class="text-xs text-muted">Letters, numbers, hyphens, underscores only</span>
      </template>
    </UFormField>

    <!-- Discount Type and Value -->
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Discount Type" name="applicationType" required>
        <USelect
          v-model="state.applicationType"
          class="w-full"
          :items="applicationTypeOptions"
        />
      </UFormField>

      <UFormField :label="valueLabel" name="value" required>
        <UInput
          v-model.number="state.value"
          type="number"
          :placeholder="valuePlaceholder"
          min="0"
          :max="state.applicationType === 'PERCENTAGE' ? 100 : undefined"
          step="0.01"
        >
          <template #trailing>
            <span class="text-muted text-sm">
              {{ state.applicationType === 'PERCENTAGE' ? '%' : 'EGP' }}
            </span>
          </template>
        </UInput>
      </UFormField>
    </div>

    <!-- Scope Selection -->
    <UFormField label="Applicable To" name="scope">
      <USelect v-model="state.scope" :items="scopeOptions" class="w-full" />
    </UFormField>

    <!-- Product Types Selector -->
    <div v-if="state.scope === 'SPECIFIC_PRODUCT_TYPES'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <UFormField label="Select Product Types" name="applicableAvailabilityTypes">
        <div class="flex flex-col gap-3">
          <div
            v-for="opt in availabilityTypeOptions"
            :key="opt.value"
            class="flex items-center gap-2 cursor-pointer"
            @click.stop="toggleAvailabilityType(opt.value)"
          >
            <UCheckbox
              :model-value="isAvailabilityTypeSelected(opt.value)"
              @click.stop
              @update:model-value="toggleAvailabilityType(opt.value)"
            />
            <span class="text-sm select-none">{{ opt.label }}</span>
          </div>
        </div>
      </UFormField>
    </div>

    <!-- Specific Products Selector -->
    <div v-if="state.scope === 'SPECIFIC_PRODUCTS'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <UFormField label="Select Products" name="applicableProductIds">
        <UInputMenu
          :model-value="undefined"
          :items="filteredProducts"
          :loading="loadingProducts"
          placeholder="Search and add products..."
          option-attribute="label"
          by="id"
          class="w-full"
          @update:model-value="addProduct"
          @update:search-term="onProductSearch"
        />
      </UFormField>

      <!-- Selected Products as Badges -->
      <div v-if="selectedProductObjects.length > 0" class="flex flex-wrap gap-2 mt-3">
        <UBadge
          v-for="product in selectedProductObjects"
          :key="product.id"
          color="neutral"
          variant="outline"
          class="cursor-pointer hover:opacity-80 !py-0 transition-opacity"
        >
          <span class="mr-1">{{ product.label }}</span>
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="primary"
            variant="ghost"
            class="ml-1 -mr-1 !p-0.5"
            @click="removeProduct(product.id)"
          />
        </UBadge>
      </div>

      <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
        No products selected. Search and click to add products.
      </p>
    </div>

    <!-- Validity Period -->
    <div class="grid grid-cols-2 gap-4 items-end">
      <UFormField label="Valid From" name="validFrom" :ui="{ label: 'whitespace-nowrap pe-4' }">
        <UInput
          v-model="validFromStr"
          type="datetime-local"
        />
        <template #hint>
          <span class="text-xs text-muted">Leave empty for immediate start</span>
        </template>
      </UFormField>

      <UFormField label="Valid Until" name="validTo" :error="dateError ?? undefined">
        <UInput
          v-model="validToStr"
          type="datetime-local"
        />
        <template #hint>
          <span class="text-xs text-muted">Leave empty for no expiry</span>
        </template>
      </UFormField>
    </div>

    <!-- Usage Limit -->
    <UFormField label="Usage Limit" name="usageLimit">
      <UInput
        v-model.number="state.usageLimit"
        type="number"
        placeholder="Unlimited"
        min="1"
      />
      <template #hint>
        <span class="text-xs text-muted">Maximum number of times this code can be used</span>
      </template>
    </UFormField>

    <!-- Active Toggle -->
    <UFormField label="Status" name="isActive">
      <div class="flex items-center gap-3">
        <USwitch v-model="state.isActive" />
        <span class="text-sm">
          {{ state.isActive ? 'Active - Code can be used' : 'Inactive - Code is disabled' }}
        </span>
      </div>
    </UFormField>

    <!-- Submit Button -->
    <div class="flex justify-end gap-2 pt-4 border-t border-default">
      <UButton
        type="submit"
        :loading="submitting"
        :label="mode === 'create' ? 'Create Promo Code' : 'Save Changes'"
        icon="i-lucide-check"
      />
    </div>
  </UForm>
</template>
