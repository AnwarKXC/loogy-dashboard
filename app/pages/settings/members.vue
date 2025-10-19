<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'

import type { FormSubmitEvent } from '#ui/types'
import type { SuperAdminAccount } from '~/types'

const superAdmin = useSuperAdminState()
const toast = useToast()

function resolveErrorMessage(error: unknown) {
  if (error instanceof FetchError) {
    return error.data?.statusMessage || error.data?.message || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

const { data, status, error, refresh } = await useFetch<{ superAdmins: SuperAdminAccount[] }>('/api/superadmin/accounts', {
  default: () => ({ superAdmins: [] })
})

const search = ref('')

const accounts = computed(() => data.value?.superAdmins ?? [])

const filteredAccounts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) {
    return accounts.value
  }

  return accounts.value.filter((account) => {
    const nameMatch = account.name?.toLowerCase().includes(term) ?? false
    return nameMatch || account.email.toLowerCase().includes(term)
  })
})

const canInvite = computed(() => superAdmin.value?.role === 'OWNER')

const inviteSchema = z.object({
  name: z.string().trim().max(120, 'Name must be at most 120 characters').optional(),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MANAGER', 'SALES'])
})

type InviteSchema = z.infer<typeof inviteSchema>

const inviteState = reactive<InviteSchema>({
  name: '',
  email: '',
  password: '',
  role: 'MANAGER'
})

const inviting = ref(false)

async function handleInvite(event: FormSubmitEvent<InviteSchema>) {
  if (!canInvite.value) {
    return
  }

  inviting.value = true

  try {
    await $fetch('/api/superadmin/accounts', {
      method: 'POST',
      body: {
        name: event.data.name?.trim() || undefined,
        email: event.data.email,
        password: event.data.password,
        role: event.data.role
      }
    })

    toast.add({
      title: 'Super admin added',
      description: `${event.data.email} can now sign in`,
      color: 'success'
    })

    inviteState.name = ''
    inviteState.email = ''
    inviteState.password = ''
    inviteState.role = 'MANAGER'

    await refresh()
  } catch (err) {
    toast.add({
      title: 'Unable to add super admin',
      description: resolveErrorMessage(err),
      color: 'error'
    })
  } finally {
    inviting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="Super admin access"
      description="Manage who can access the dashboard with elevated permissions."
      variant="naked"
      orientation="horizontal"
      class="mb-2"
    >
      <div class="flex items-center gap-2 text-sm text-muted">
        <UBadge :color="superAdmin?.role === 'OWNER' ? 'primary' : 'neutral'" variant="soft">
          {{ superAdmin?.role ?? 'OWNER' }}
        </UBadge>
        <span>
          Current role
        </span>
      </div>
    </UPageCard>

    <UPageCard
      v-if="canInvite"
      title="Invite a new super admin"
      description="Owners can create manager or sales accounts with dashboard access."
      variant="subtle"
      class="max-w-2xl"
    >
      <UForm
        :schema="inviteSchema"
        :state="inviteState"
        class="grid gap-4 sm:grid-cols-2"
        @submit="handleInvite"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="inviteState.name"
            placeholder="Ada Lovelace"
            autocomplete="name"
          />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput
            v-model="inviteState.email"
            type="email"
            placeholder="manager@example.com"
            autocomplete="email"
            required
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="inviteState.password"
            type="password"
            placeholder="Temporary password"
            autocomplete="new-password"
            required
          />
        </UFormField>

        <UFormField label="Role" name="role">
          <USelect
            v-model="inviteState.role"
            :items="[
              { label: 'Manager', value: 'MANAGER' },
              { label: 'Sales', value: 'SALES' }
            ]"
          />
        </UFormField>

        <div class="sm:col-span-2 flex justify-end">
          <UButton
            type="submit"
            color="primary"
            :loading="inviting"
            label="Send invite"
          />
        </div>
      </UForm>
    </UPageCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Unable to load super admins"
      :description="resolveErrorMessage(error)"
    />

    <UPageCard
      variant="subtle"
      :ui="{ container: 'p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }"
    >
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search by name or email"
            class="w-full sm:max-w-sm"
          />

          <UBadge variant="soft" color="neutral">
            {{ filteredAccounts.length }} super admin{{ filteredAccounts.length === 1 ? '' : 's' }}
          </UBadge>
        </div>
      </template>

      <div v-if="status === 'pending'" class="p-6">
        <USkeleton class="h-28 w-full" />
      </div>
      <SettingsMembersList
        v-else
        :super-admins="filteredAccounts"
        :current-super-admin-id="superAdmin?.id ?? null"
      />
    </UPageCard>
  </div>
</template>
