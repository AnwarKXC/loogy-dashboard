<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()

const schema = z.object({
  phoneNumber: z.string().max(20).nullable().optional(),
  vodafoneCashNumber: z.string().max(20).nullable().optional(),
  instaPayUrl: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  instaPayQrCode: z.string().nullable().optional(),
  instaPayNumber: z.string().max(50).nullable().optional()
})

type Schema = z.output<typeof schema>

const { data, refresh, status } = await useFetch('/api/store-settings/contact')

const state = reactive<Schema>({
  phoneNumber: null,
  vodafoneCashNumber: null,
  instaPayUrl: null,
  instaPayQrCode: null,
  instaPayNumber: null
})

watch(data, (val) => {
  if (val) {
    state.phoneNumber = val.phoneNumber ?? null
    state.vodafoneCashNumber = val.vodafoneCashNumber ?? null
    state.instaPayUrl = val.instaPayUrl ?? null
    state.instaPayQrCode = val.instaPayQrCode ?? null
    state.instaPayNumber = val.instaPayNumber ?? null
  }
}, { immediate: true })

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    // Clean empty strings to null
    const cleanData = {
      ...event.data,
      instaPayUrl: event.data.instaPayUrl || null
    }
    await $fetch('/api/store-settings/contact', {
      method: 'PATCH',
      body: cleanData
    })
    toast.add({
      title: 'Settings saved',
      description: 'Contact settings have been updated.',
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        Contact Information
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Configure your store's contact details and payment information
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
      <UFormField label="Phone Number" name="phoneNumber">
        <UInput
          v-model="state.phoneNumber"
          placeholder="+20 123 456 7890"
          class="w-full"
        />
      </UFormField>

      <div class="border-t pt-6">
        <h3 class="text-lg font-medium mb-4">
          Payment Methods
        </h3>

        <div class="space-y-4">
          <UFormField label="Vodafone Cash Number" name="vodafoneCashNumber">
            <UInput
              v-model="state.vodafoneCashNumber"
              placeholder="01xxxxxxxxx"
              class="w-full"
            />
          </UFormField>

          <UFormField label="InstaPay Number" name="instaPayNumber">
            <UInput
              v-model="state.instaPayNumber"
              placeholder="InstaPay account number"
              class="w-full"
            />
          </UFormField>

          <UFormField label="InstaPay URL" name="instaPayUrl">
            <UInput
              v-model="state.instaPayUrl"
              placeholder="https://instapay.eg/..."
              class="w-full"
            />
          </UFormField>

          <UFormField label="InstaPay QR Code Image URL" name="instaPayQrCode">
            <UInput
              v-model="state.instaPayQrCode"
              placeholder="https://..."
              class="w-full"
            />
            <template v-if="state.instaPayQrCode" #help>
              <img
                :src="state.instaPayQrCode"
                alt="InstaPay QR Code"
                class="mt-2 w-32 h-32 object-contain border rounded"
              >
            </template>
          </UFormField>
        </div>
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
