<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'

import type { SuperAdminAccount } from '~/types'

interface Props {
  superAdmins: SuperAdminAccount[]
  currentSuperAdminId?: number | null
}

const props = defineProps<Props>()

function formatRole(role: SuperAdminAccount['role']) {
  switch (role) {
    case 'OWNER':
      return 'Owner'
    case 'MANAGER':
      return 'Manager'
    case 'SALES':
      return 'Sales'
    default:
      return role
  }
}

function formatCreatedAt(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

function displayName(account: SuperAdminAccount) {
  return account.name?.trim() || account.email
}
</script>

<template>
  <ul role="list" class="divide-y divide-default">
    <li
      v-for="account in props.superAdmins"
      :key="account.id"
      class="flex flex-col gap-2 py-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex flex-col min-w-0">
          <p class="text-sm font-medium text-highlighted truncate">
            {{ displayName(account) }}
          </p>
          <p class="text-xs text-muted truncate">
            {{ account.email }}
          </p>
        </div>

        <UBadge v-if="account.id === props.currentSuperAdminId" color="primary" variant="soft">
          You
        </UBadge>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted">
        <UBadge variant="soft" color="neutral">
          {{ formatRole(account.role) }}
        </UBadge>
        <span class="hidden sm:inline">•</span>
        <span>Created {{ formatCreatedAt(account.createdAt) }}</span>
      </div>
    </li>
  </ul>
</template>
