<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()

const schema = z.object({
  facebookGroup: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  facebookPage: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  instagramPage: z.string().url('Invalid URL').nullable().optional().or(z.literal(''))
})

type Schema = z.output<typeof schema>

const { data, refresh, status } = await useFetch('/api/store-settings/social')

const state = reactive<Schema>({
  facebookGroup: null,
  facebookPage: null,
  instagramPage: null
})

watch(data, (val) => {
  if (val) {
    state.facebookGroup = val.facebookGroup ?? null
    state.facebookPage = val.facebookPage ?? null
    state.instagramPage = val.instagramPage ?? null
  }
}, { immediate: true })

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    // Clean empty strings to null
    const cleanData = {
      facebookGroup: event.data.facebookGroup || null,
      facebookPage: event.data.facebookPage || null,
      instagramPage: event.data.instagramPage || null
    }
    await $fetch('/api/store-settings/social', {
      method: 'PATCH',
      body: cleanData
    })
    toast.add({
      title: 'Settings saved',
      description: 'Social links have been updated.',
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
        Social Media Links
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Configure your store's social media presence
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
      <UFormField label="Facebook Page" name="facebookPage">
        <template #leading>
          <UIcon name="i-simple-icons-facebook" class="text-blue-600" />
        </template>
        <UInput
          v-model="state.facebookPage"
          placeholder="https://facebook.com/yourpage"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Facebook Group" name="facebookGroup">
        <template #leading>
          <UIcon name="i-simple-icons-facebook" class="text-blue-600" />
        </template>
        <UInput
          v-model="state.facebookGroup"
          placeholder="https://facebook.com/groups/yourgroup"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Instagram Page" name="instagramPage">
        <template #leading>
          <UIcon name="i-simple-icons-instagram" class="text-pink-600" />
        </template>
        <UInput
          v-model="state.instagramPage"
          placeholder="https://instagram.com/yourpage"
          class="w-full"
        />
      </UFormField>

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
