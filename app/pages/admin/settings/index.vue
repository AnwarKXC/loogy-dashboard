<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'

import type { FormSubmitEvent } from '#ui/types'
import type { SuperAdminSessionUser } from '~/composables/useSuperAdmin'

const superAdmin = useSuperAdminState()
const toast = useToast()

const profileSchema = z.object({
  name: z.string().max(120, 'Name must be 120 characters or fewer').optional(),
  email: z.string().email('Enter a valid email address')
})

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
}).refine(data => data.currentPassword !== data.newPassword, {
  path: ['newPassword'],
  message: 'New password must be different from current password'
})

type ProfileSchema = z.infer<typeof profileSchema>
type PasswordSchema = z.infer<typeof passwordSchema>

const profileState = reactive<ProfileSchema>({
  name: superAdmin.value?.name ?? '',
  email: superAdmin.value?.email ?? ''
})

const passwordState = reactive<PasswordSchema>({
  currentPassword: '',
  newPassword: ''
})

const savingProfile = ref(false)
const savingPassword = ref(false)

watch(
  superAdmin,
  (value) => {
    profileState.name = value?.name ?? ''
    profileState.email = value?.email ?? ''
  },
  { immediate: true }
)

function resolveErrorMessage(error: unknown) {
  if (error instanceof FetchError) {
    return error.data?.statusMessage || error.data?.message || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

async function handleProfileSubmit(event: FormSubmitEvent<ProfileSchema>) {
  const payload: Record<string, unknown> = {}
  const trimmedName = event.data.name?.trim() ?? ''

  if (trimmedName && trimmedName !== (superAdmin.value?.name ?? '')) {
    payload.name = trimmedName
  }

  const normalizedEmail = event.data.email.toLowerCase()
  if (normalizedEmail !== (superAdmin.value?.email ?? '').toLowerCase()) {
    payload.email = normalizedEmail
  }

  if (Object.keys(payload).length === 0) {
    toast.add({
      title: 'No changes to save',
      icon: 'i-lucide-info',
      color: 'neutral'
    })
    return
  }

  savingProfile.value = true

  try {
    const { superAdmin: updated } = await $fetch<{ superAdmin: SuperAdminSessionUser }>('/api/superadmin/account', {
      method: 'PATCH',
      body: payload
    })

    superAdmin.value = updated
    toast.add({
      title: 'Profile updated',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Update failed',
      description: resolveErrorMessage(error),
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })
  } finally {
    savingProfile.value = false
  }
}

async function handlePasswordSubmit(event: FormSubmitEvent<PasswordSchema>) {
  savingPassword.value = true

  try {
    await $fetch<{ superAdmin: SuperAdminSessionUser }>('/api/superadmin/account', {
      method: 'PATCH',
      body: {
        passwordChange: {
          currentPassword: event.data.currentPassword,
          newPassword: event.data.newPassword
        }
      }
    })

    passwordState.currentPassword = ''
    passwordState.newPassword = ''

    toast.add({
      title: 'Password updated',
      icon: 'i-lucide-lock',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Password update failed',
      description: resolveErrorMessage(error),
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="Account"
      description="Manage the name and email associated with your super admin account."
      variant="subtle"
      class="space-y-6"
    >
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">Role</span>
        <UBadge color="primary" variant="soft">
          {{ superAdmin?.role }}
        </UBadge>
      </div>

      <UForm
        :schema="profileSchema"
        :state="profileState"
        class="gap-4  grid "
        @submit="handleProfileSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="profileState.name"
            placeholder="Ada Lovelace"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput
            v-model="profileState.email"
            type="email"
            placeholder="owner@example.com"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-center justify-end gap-3">
          <UButton
            type="submit"
            color="primary"
            :loading="savingProfile"
            label="Save changes"
          />
        </div>
      </UForm>
    </UPageCard>

    <UPageCard
      title="Security"
      description="Update your password to keep your super admin account secure."
      variant="subtle"
    >
      <UForm
        :schema="passwordSchema"
        :state="passwordState"
        class="grid gap-4 "
        @submit="handlePasswordSubmit"
      >
        <UFormField label="Current password" name="currentPassword">
          <UInput
            v-model="passwordState.currentPassword"
            type="password"
            autocomplete="current-password"
            placeholder="Current password"
            class="w-full"
          />
        </UFormField>

        <UFormField label="New password" name="newPassword">
          <UInput
            v-model="passwordState.newPassword"
            type="password"
            autocomplete="new-password"
            placeholder="New password"
            class="w-full"
          />
        </UFormField>
        <div class="flex items-center justify-end gap-3">
          <UButton
            type="submit"
            color="primary"
            :loading="savingPassword"
            label="Update password"
          />
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
