<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()

const schema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeDescription: z.string().max(1000).nullable().optional(),
  currency: z.string().min(1).max(10),
  defaultLanguage: z.string().min(2).max(5)
})

type Schema = z.output<typeof schema>

const { data, refresh, status } = await useFetch('/api/store-settings/general')

const state = reactive<Schema>({
  storeName: '',
  storeDescription: null,
  currency: 'EGP',
  defaultLanguage: 'ar'
})

watch(data, (val) => {
  if (val) {
    state.storeName = val.storeName ?? ''
    state.storeDescription = val.storeDescription ?? null
    state.currency = val.currency ?? 'EGP'
    state.defaultLanguage = val.defaultLanguage ?? 'ar'
  }
}, { immediate: true })

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await $fetch('/api/store-settings/general', {
      method: 'PATCH',
      body: event.data
    })
    toast.add({
      title: 'Settings saved',
      description: 'Store general settings have been updated.',
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

const currencyOptions = [
  { label: 'EGP - Egyptian Pound', value: 'EGP' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'SAR - Saudi Riyal', value: 'SAR' },
  { label: 'AED - UAE Dirham', value: 'AED' }
]

const languageOptions = [
  { label: 'Arabic', value: 'ar' },
  { label: 'English', value: 'en' }
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        Store General Settings
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Configure your store's basic information
      </p>
    </div>

    <USkeleton v-if="status === 'pending'" class="h-64 w-full" />

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
    >
      <UFormField label="Store Name" name="storeName" required>
        <UInput v-model="state.storeName" placeholder="My Awesome Store" class="w-full" />
      </UFormField>

      <UFormField label="Store Description" name="storeDescription">
        <UTextarea
          v-model="state.storeDescription"
          placeholder="A brief description of your store..."
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Currency" name="currency">
          <USelect
            v-model="state.currency"
            :items="currencyOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Default Language" name="defaultLanguage">
          <USelect
            v-model="state.defaultLanguage"
            :items="languageOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="flex justify-end">
        <UButton
          type="submit"
          :loading="saving"
          icon="i-lucide-save"
        >
          Save Changes
        </UButton>
      </div>
    </UForm>
  </div>
</template>
