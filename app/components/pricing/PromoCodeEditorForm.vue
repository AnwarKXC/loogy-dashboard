<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { PromoCodeEditorValues, PromoCodeApplicationType } from '~/types'

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
  isActive: z.boolean()
}).refine((data) => {
  if (data.applicationType === 'PERCENTAGE' && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'Percentage cannot exceed 100%',
  path: ['value']
})

type FormState = z.infer<typeof schema>

const state = reactive<FormState>({
  code: props.initialValues?.code ?? '',
  applicationType: props.initialValues?.applicationType ?? 'PERCENTAGE',
  value: props.initialValues?.value ?? 10,
  usageLimit: props.initialValues?.usageLimit ?? null,
  isActive: props.initialValues?.isActive ?? true
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
      isActive: next.isActive ?? true
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
    isActive: props.initialValues?.isActive ?? true
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
    isActive: state.isActive
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

    <!-- Validity Period -->
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Valid From" name="validFrom">
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
