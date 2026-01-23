<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

type TaxSettingsData = {
  isEnabled: boolean
  taxRate: number
  taxName: string
  taxNumber: string | null
  includedInPrice: boolean
  applyToShipping: boolean
}

const toast = useToast()
const saving = ref(false)

const { data, refresh, status } = await useFetch<TaxSettingsData>('/api/store-settings/tax')

const schema = z.object({
  isEnabled: z.boolean(),
  taxRate: z.number().min(0).max(100),
  taxName: z.string().min(1).max(50),
  taxNumber: z.string().max(50).nullable(),
  includedInPrice: z.boolean(),
  applyToShipping: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  isEnabled: false,
  taxRate: 0,
  taxName: 'VAT',
  taxNumber: null,
  includedInPrice: true,
  applyToShipping: false
})

// Sync state with fetched data
watch(data, (newData) => {
  if (newData) {
    state.isEnabled = newData.isEnabled
    state.taxRate = newData.taxRate
    state.taxName = newData.taxName
    state.taxNumber = newData.taxNumber ?? null
    state.includedInPrice = newData.includedInPrice
    state.applyToShipping = newData.applyToShipping
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await $fetch('/api/store-settings/tax', {
      method: 'PATCH',
      body: event.data
    })
    toast.add({
      title: 'Tax settings updated',
      description: 'Your tax configuration has been saved.',
      color: 'success'
    })
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

const taxPresetOptions = [
  { label: 'VAT (Value Added Tax)', value: 'VAT' },
  { label: 'Sales Tax', value: 'Sales Tax' },
  { label: 'GST (Goods & Services Tax)', value: 'GST' },
  { label: 'Custom', value: 'Custom' }
]

function selectPreset(preset: string) {
  if (preset !== 'Custom') {
    state.taxName = preset
  }
}
</script>

<template>
  <UDashboardPanel id="tax-settings">
    <template #header>
      <UDashboardNavbar title="Tax Configuration" />
    </template>

    <template #body>
      <div class="">
        <USkeleton v-if="status === 'pending'" class="h-96 w-full" />

        <UForm
          v-else
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <!-- Enable/Disable Tax -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-semibold">
                    Enable Tax
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Enable tax calculation for orders
                  </p>
                </div>
                <USwitch v-model="state.isEnabled" />
              </div>
            </template>
          </UCard>

          <!-- Tax Details -->
          <UCard :class="{ 'opacity-50 pointer-events-none': !state.isEnabled }">
            <template #header>
              <h3 class="text-base font-semibold">
                Tax Details
              </h3>
            </template>

            <div class="space-y-4">
              <UFormField label="Tax Type" name="taxName">
                <div class="flex gap-2">
                  <USelect
                    :model-value="taxPresetOptions.find(o => o.value === state.taxName) ? state.taxName : 'Custom'"
                    :items="taxPresetOptions"
                    class="w-56"
                    @update:model-value="selectPreset"
                  />
                  <UInput
                    v-model="state.taxName"
                    placeholder="Tax name"
                    class="flex-1"
                  />
                </div>
              </UFormField>

              <UFormField label="Tax Rate (%)" name="taxRate">
                <UInput
                  v-model.number="state.taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 14"
                >
                  <template #trailing>
                    <span class="text-gray-500">%</span>
                  </template>
                </UInput>
                <template #hint>
                  Enter the tax percentage (e.g., 14 for 14% VAT)
                </template>
              </UFormField>

              <UFormField label="Tax Registration Number" name="taxNumber">
                <UInput
                  v-model="state.taxNumber"
                  placeholder="Your business tax number (optional)"
                />
                <template #hint>
                  This will appear on invoices
                </template>
              </UFormField>
            </div>
          </UCard>

          <!-- Tax Calculation Options -->
          <UCard :class="{ 'opacity-50 pointer-events-none': !state.isEnabled }">
            <template #header>
              <h3 class="text-base font-semibold">
                Tax Calculation
              </h3>
            </template>

            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <h4 class="font-medium">
                    Tax Included in Price
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Product prices already include tax (recommended for B2C)
                  </p>
                </div>
                <USwitch v-model="state.includedInPrice" />
              </div>

              <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <h4 class="font-medium">
                    Apply Tax to Shipping
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Calculate tax on shipping costs as well
                  </p>
                </div>
                <USwitch v-model="state.applyToShipping" />
              </div>
            </div>
          </UCard>

          <!-- Preview -->
          <UCard v-if="state.isEnabled" class="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <template #header>
              <h3 class="text-base font-semibold text-blue-700 dark:text-blue-300">
                Tax Preview
              </h3>
            </template>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Example Product Price:</span>
                <span>100.00 EGP</span>
              </div>
              <div v-if="state.includedInPrice" class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{{ state.taxName }} ({{ state.taxRate }}% included):</span>
                <span>{{ (100 * state.taxRate / (100 + state.taxRate)).toFixed(2) }} EGP</span>
              </div>
              <div v-else class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{{ state.taxName }} ({{ state.taxRate }}%):</span>
                <span>+{{ (100 * state.taxRate / 100).toFixed(2) }} EGP</span>
              </div>
              <div class="flex justify-between font-semibold border-t pt-2">
                <span>Customer Pays:</span>
                <span>{{ state.includedInPrice ? '100.00' : (100 + state.taxRate).toFixed(2) }} EGP</span>
              </div>
            </div>
          </UCard>

          <!-- Submit -->
          <div class="flex justify-end">
            <UButton
              type="submit"
              :loading="saving"
              icon="i-lucide-save"
            >
              Save Tax Settings
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
