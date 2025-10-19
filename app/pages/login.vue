<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'

import type { FormSubmitEvent } from '#ui/types'
import type { SuperAdminSessionUser } from '~/composables/useSuperAdmin'

definePageMeta({
  layout: false
})

const router = useRouter()
const superAdmin = useSuperAdminState()

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type LoginSchema = z.infer<typeof schema>

const state = reactive<LoginSchema>({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref<string | null>(null)

watchEffect(() => {
  if (superAdmin.value) {
    router.replace('/').catch(() => {})
  }
})

async function handleSubmit(event: FormSubmitEvent<LoginSchema>) {
  errorMessage.value = null
  loading.value = true

  try {
    const { superAdmin: session } = await $fetch<{ superAdmin: SuperAdminSessionUser }>('/api/superadmin/login', {
      method: 'POST',
      body: event.data
    })

    superAdmin.value = session
    await router.replace('/')
  } catch (err: unknown) {
    if (err instanceof FetchError) {
      if (err.response?.status === 401 || err.status === 401) {
        errorMessage.value = 'Invalid credentials'
      } else {
        errorMessage.value = err.data?.statusMessage || err.data?.message || 'Server error, please try again later'
      }
    } else if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Unable to sign in'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="space-y-1 text-center">
          <h1 class="text-2xl font-semibold">
            Super Admin Login
          </h1>
          <p class="text-sm text-muted">
            Access to the ecommerce dashboard
          </p>
        </div>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </UFormField>

        <div v-if="errorMessage" class="text-sm text-danger-500">
          {{ errorMessage }}
        </div>

        <UButton
          type="submit"
          color="primary"
          block
          :loading="loading"
        >
          Sign In
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
