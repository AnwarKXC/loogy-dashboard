<script setup lang="ts">
import { reactive, watch } from 'vue'
import { FetchError } from 'ofetch'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { PricingSettingsResponse } from '~/types'

const toast = useToast()
const superAdmin = useSuperAdminState()

// Check if user is OWNER (only owners can edit pricing)
const isOwner = computed(() => superAdmin.value?.role === 'OWNER')

const { data, status, error, refresh } = await useFetch<PricingSettingsResponse>('/api/pricing')

const settings = computed(() => data.value?.settings)

const pricingSchema = z.object({
  minOrderValue: z.coerce.number().min(0, 'Minimum order value cannot be negative').optional().nullable(),
  maxOrderValue: z.coerce.number().min(0, 'Maximum order value cannot be negative').optional().nullable(),
  bulkDiscountThreshold: z.coerce.number().min(0).optional().nullable(),
  bulkDiscountPercentage: z.coerce.number().min(0).max(100, 'Percentage cannot exceed 100').optional().nullable()
}).refine((data) => {
  if (data.minOrderValue != null && data.maxOrderValue != null) {
    return data.maxOrderValue >= data.minOrderValue
  }
  return true
}, {
  message: 'Maximum must be greater than or equal to minimum',
  path: ['maxOrderValue']
})

type PricingSchema = z.infer<typeof pricingSchema>

const state = reactive<PricingSchema>({
  minOrderValue: null,
  maxOrderValue: null,
  bulkDiscountThreshold: null,
  bulkDiscountPercentage: null
})

const saving = ref(false)

// Sync state with fetched data
watch(
  settings,
  (value) => {
    if (!value) return
    state.minOrderValue = value.minOrderValue ? parseFloat(value.minOrderValue) : null
    state.maxOrderValue = value.maxOrderValue ? parseFloat(value.maxOrderValue) : null
    state.bulkDiscountThreshold = value.bulkDiscountThreshold ? parseFloat(value.bulkDiscountThreshold) : null
    state.bulkDiscountPercentage = value.bulkDiscountPercentage ? parseFloat(value.bulkDiscountPercentage) : null
  },
  { immediate: true }
)

function resolveErrorMessage(err: unknown): string {
  if (err instanceof FetchError) {
    return err.data?.statusMessage || err.data?.message || err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Something went wrong'
}

async function handleSubmit(_event: FormSubmitEvent<PricingSchema>) {
  if (!isOwner.value) {
    toast.add({
      title: 'Permission denied',
      description: 'Only owners can update pricing settings.',
      color: 'error'
    })
    return
  }

  saving.value = true

  try {
    const response = await $fetch<PricingSettingsResponse>('/api/pricing', {
      method: 'PATCH',
      body: {
        minOrderValue: state.minOrderValue,
        maxOrderValue: state.maxOrderValue,
        bulkDiscountThreshold: state.bulkDiscountThreshold,
        bulkDiscountPercentage: state.bulkDiscountPercentage
      }
    })

    // Update local state with response
    if (response.settings) {
      state.minOrderValue = response.settings.minOrderValue ? parseFloat(response.settings.minOrderValue) : null
      state.maxOrderValue = response.settings.maxOrderValue ? parseFloat(response.settings.maxOrderValue) : null
      state.bulkDiscountThreshold = response.settings.bulkDiscountThreshold ? parseFloat(response.settings.bulkDiscountThreshold) : null
      state.bulkDiscountPercentage = response.settings.bulkDiscountPercentage ? parseFloat(response.settings.bulkDiscountPercentage) : null
    }

    toast.add({
      title: 'Settings saved',
      description: 'Pricing settings have been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: 'Save failed',
      description: resolveErrorMessage(err),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function handleRefresh() {
  return refresh()
}
</script>

<template>
  <UCard
    title="Pricing Settings"
    variant="subtle"
    class="mb-6"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <div class="">
          <h1 class="text-2xl font-bold">
            Pricing Settings
          </h1>
          <p class="text-sm text-muted">
            Configure the pricing rules for your store
          </p>
        </div>
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="status === 'pending'"
          @click="handleRefresh"
        />
      </div>
    </template>
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Unable to load pricing settings"
      :description="error.message"
      class="mb-6"
    />

    <UAlert
      v-if="!isOwner"
      color="warning"
      variant="soft"
      icon="i-lucide-shield-alert"
      title="View Only"
      description="Only owners can modify pricing settings."
      class="mb-6"
    />

    <div v-if="settings">
      <UForm
        :schema="pricingSchema"
        :state="state"
        class="space-y-8"
        @submit="handleSubmit"
      >
        <!-- Order Limits Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shopping-bag" class="size-5 text-primary" />
            <h3 class="text-lg font-semibold">
              Order Limits
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Minimum Order Value" name="minOrderValue">
              <UInput
                v-model.number="state.minOrderValue"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                :disabled="!isOwner"
              >
                <template #trailing>
                  <span class="text-muted text-sm">EGP</span>
                </template>
              </UInput>
              <template #hint>
                <span class="text-xs text-muted">Customers must order at least this amount</span>
              </template>
            </UFormField>

            <UFormField label="Maximum Order Value" name="maxOrderValue">
              <UInput
                v-model.number="state.maxOrderValue"
                type="number"
                placeholder="No maximum"
                min="0"
                step="0.01"
                :disabled="!isOwner"
              >
                <template #trailing>
                  <span class="text-muted text-sm">EGP</span>
                </template>
              </UInput>
              <template #hint>
                <span class="text-xs text-muted">Maximum allowed order total (leave empty for no limit)</span>
              </template>
            </UFormField>
          </div>
        </div>

        <USeparator />

        <!-- Bulk Discount Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-percent" class="size-5 text-primary" />
            <h3 class="text-lg font-semibold">
              Bulk Discount
            </h3>
          </div>
          <p class="text-sm text-muted">
            Automatically apply a discount when the order total reaches a certain threshold.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Order Threshold" name="bulkDiscountThreshold">
              <UInput
                v-model.number="state.bulkDiscountThreshold"
                type="number"
                placeholder="e.g. 500"
                min="0"
                step="0.01"
                :disabled="!isOwner"
              >
                <template #trailing>
                  <span class="text-muted text-sm">EGP</span>
                </template>
              </UInput>
              <template #hint>
                <span class="text-xs text-muted">Minimum order amount to trigger discount</span>
              </template>
            </UFormField>

            <UFormField label="Discount Percentage" name="bulkDiscountPercentage">
              <UInput
                v-model.number="state.bulkDiscountPercentage"
                type="number"
                placeholder="e.g. 10"
                min="0"
                max="100"
                step="0.1"
                :disabled="!isOwner"
              >
                <template #trailing>
                  <span class="text-muted text-sm">%</span>
                </template>
              </UInput>
              <template #hint>
                <span class="text-xs text-muted">Percentage discount applied when threshold is met</span>
              </template>
            </UFormField>
          </div>
        </div>

        <!-- Save Button -->
        <div v-if="isOwner" class="flex justify-end pt-6 border-t border-default">
          <UButton
            type="submit"
            :loading="saving"
            label="Save Settings"
            icon="i-lucide-save"
          />
        </div>
      </UForm>

      <!-- Last Updated Info -->
      <div v-if="settings" class="mt-8 pt-4 border-t border-default">
        <p class="text-xs text-muted">
          Last updated: {{ new Date(settings.updatedAt).toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
    </div>
  </UCard>
</template>
