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
  shippingFee: z.coerce.number().min(0, 'Shipping fee cannot be negative').optional().nullable(),
  minOrderValue: z.coerce.number().min(0, 'Minimum order value cannot be negative').optional().nullable(),
  maxOrderValue: z.coerce.number().min(0, 'Maximum order value cannot be negative').optional().nullable(),
  bulkDiscountThreshold: z.coerce.number().min(0).optional().nullable(),
  bulkDiscountPercentage: z.coerce.number().min(0).max(100, 'Percentage cannot exceed 100').optional().nullable(),
  currency: z.string().min(1, 'Currency is required').max(10)
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
  shippingFee: null,
  minOrderValue: null,
  maxOrderValue: null,
  bulkDiscountThreshold: null,
  bulkDiscountPercentage: null,
  currency: 'EGP'
})

const saving = ref(false)

// Sync state with fetched data
watch(
  settings,
  (value) => {
    if (!value) return
    state.shippingFee = value.shippingFee ? parseFloat(value.shippingFee) : null
    state.minOrderValue = value.minOrderValue ? parseFloat(value.minOrderValue) : null
    state.maxOrderValue = value.maxOrderValue ? parseFloat(value.maxOrderValue) : null
    state.bulkDiscountThreshold = value.bulkDiscountThreshold ? parseFloat(value.bulkDiscountThreshold) : null
    state.bulkDiscountPercentage = value.bulkDiscountPercentage ? parseFloat(value.bulkDiscountPercentage) : null
    state.currency = value.currency
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
        shippingFee: state.shippingFee,
        minOrderValue: state.minOrderValue,
        maxOrderValue: state.maxOrderValue,
        bulkDiscountThreshold: state.bulkDiscountThreshold,
        bulkDiscountPercentage: state.bulkDiscountPercentage,
        currency: state.currency
      }
    })

    // Update local state with response
    if (response.settings) {
      state.shippingFee = response.settings.shippingFee ? parseFloat(response.settings.shippingFee) : null
      state.minOrderValue = response.settings.minOrderValue ? parseFloat(response.settings.minOrderValue) : null
      state.maxOrderValue = response.settings.maxOrderValue ? parseFloat(response.settings.maxOrderValue) : null
      state.bulkDiscountThreshold = response.settings.bulkDiscountThreshold ? parseFloat(response.settings.bulkDiscountThreshold) : null
      state.bulkDiscountPercentage = response.settings.bulkDiscountPercentage ? parseFloat(response.settings.bulkDiscountPercentage) : null
      state.currency = response.settings.currency
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

const currencyOptions = [
  { label: 'Egyptian Pound (EGP)', value: 'EGP' },
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'Saudi Riyal (SAR)', value: 'SAR' },
  { label: 'UAE Dirham (AED)', value: 'AED' }
]

function handleRefresh() {
  return refresh()
}
</script>

<template>
  <UDashboardPanel id="pricing-settings">
    <template #header>
      <UDashboardNavbar title="Pricing Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-ccw"
            color="neutral"
            variant="outline"
            :loading="status === 'pending'"
            @click="handleRefresh"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
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

      <div v-if="settings" class="max-w-2xl">
        <UForm
          :schema="pricingSchema"
          :state="state"
          class="space-y-8"
          @submit="handleSubmit"
        >
          <!-- Currency Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-coins" class="size-5 text-primary" />
              <h3 class="text-lg font-semibold">
                Currency
              </h3>
            </div>

            <UFormField label="Store Currency" name="currency" required>
              <USelect
                v-model="state.currency"
                :items="currencyOptions"
                :disabled="!isOwner"
                class="max-w-xs"
              />
              <template #hint>
                <span class="text-xs text-muted">All prices will be displayed in this currency</span>
              </template>
            </UFormField>
          </div>

          <USeparator />

          <!-- Shipping Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-truck" class="size-5 text-primary" />
              <h3 class="text-lg font-semibold">
                Shipping
              </h3>
            </div>

            <UFormField label="Default Shipping Fee" name="shippingFee">
              <UInput
                v-model.number="state.shippingFee"
                type="number"
                placeholder="e.g. 50"
                min="0"
                step="0.01"
                :disabled="!isOwner"
                class="max-w-xs"
              >
                <template #trailing>
                  <span class="text-muted text-sm">{{ state.currency }}</span>
                </template>
              </UInput>
              <template #hint>
                <span class="text-xs text-muted">Applied to all orders (set to 0 for free shipping)</span>
              </template>
            </UFormField>
          </div>

          <USeparator />

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
                  placeholder="No minimum"
                  min="0"
                  step="0.01"
                  :disabled="!isOwner"
                >
                  <template #trailing>
                    <span class="text-muted text-sm">{{ state.currency }}</span>
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
                    <span class="text-muted text-sm">{{ state.currency }}</span>
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
                    <span class="text-muted text-sm">{{ state.currency }}</span>
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
    </template>
  </UDashboardPanel>
</template>
