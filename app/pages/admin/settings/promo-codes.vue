<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import PromoCodeEditorForm from '~/components/pricing/PromoCodeEditorForm.vue'
import type { PromoCodeEditorValues, PromoCodeListItem, PromoCodeListResponse, PromoCodeStatus } from '~/types'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive' | 'expired'>('all')
const sort = ref<'newest' | 'oldest' | 'code-asc' | 'code-desc' | 'usage'>('newest')

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  search: search.value.trim() ? search.value.trim() : undefined,
  status: statusFilter.value,
  sort: sort.value
}))

const { data, status, error, refresh } = await useFetch<PromoCodeListResponse>('/api/pricing/promo-codes', {
  query,
  watch: [query]
})

watch([pageSize, sort, statusFilter], () => {
  page.value = 1
})

watch(search, (value, previous) => {
  if (value.length === 0 && previous.length > 0) {
    page.value = 1
  }
})

const promoCodes = computed(() => data.value?.items ?? [])
const totalItems = computed(() => data.value?.pagination.totalItems ?? 0)
const totalPages = computed(() => data.value?.pagination.totalPages ?? 0)

const createOpen = ref(false)
const editOpen = ref(false)
const deleteOpen = ref(false)
const formLoading = ref(false)
const deleteLoading = ref(false)

const selectedCode = ref<PromoCodeListItem | null>(null)

const editInitialValues = computed<Partial<PromoCodeEditorValues>>(() => {
  if (!selectedCode.value) {
    return {}
  }

  const code = selectedCode.value

  return {
    code: code.code,
    applicationType: code.applicationType,
    value: parseFloat(code.value),
    validFrom: code.validFrom ? new Date(code.validFrom) : null,
    validTo: code.validTo ? new Date(code.validTo) : null,
    usageLimit: code.usageLimit,
    isActive: code.isActive,
    scope: code.scope ?? 'GLOBAL',
    applicableAvailabilityTypes: code.applicableAvailabilityTypes ?? [],
    applicableProductIds: code.applicableProductIds ?? []
  }
})

const statusColorMap: Record<PromoCodeStatus, 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  expired: 'error'
}

const columns: TableColumn<PromoCodeListItem>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-mono font-semibold text-highlighted' }, row.original.code),
        h(UBadge, {
          variant: 'subtle',
          color: statusColorMap[row.original.status]
        }, () => row.original.status)
      ])
    }
  },
  {
    accessorKey: 'discount',
    header: 'Discount',
    cell: ({ row }) => {
      const code = row.original
      const value = parseFloat(code.value)
      if (code.applicationType === 'PERCENTAGE') {
        return h('span', { class: 'font-medium' }, `${value}%`)
      }
      return h('span', { class: 'font-medium' }, `${value.toFixed(2)} EGP`)
    }
  },
  {
    accessorKey: 'scope',
    header: 'Applies To',
    cell: ({ row }) => {
      const code = row.original
      const scope = code.scope ?? 'GLOBAL'

      if (scope === 'GLOBAL') {
        return h(UBadge, { variant: 'soft', color: 'neutral' }, () => 'All Products')
      }

      if (scope === 'SPECIFIC_PRODUCT_TYPES') {
        const types = code.applicableAvailabilityTypes ?? []
        const typeLabels: Record<string, string> = {
          IN_STOCK_EGYPT: 'In Stock',
          ARRIVING_SOON: 'Arriving Soon',
          PRE_ORDER: 'Pre-Order'
        }
        const label = types.map(t => typeLabels[t] || t).join(', ') || 'Product Types'
        return h(UBadge, { variant: 'soft', color: 'info' }, () => label)
      }

      if (scope === 'SPECIFIC_PRODUCTS') {
        const count = code.applicableProductIds?.length ?? 0
        return h(UBadge, { variant: 'soft', color: 'primary' }, () => `${count} Product${count !== 1 ? 's' : ''}`)
      }

      return h('span', { class: 'text-sm text-muted' }, scope)
    }
  },
  {
    accessorKey: 'usage',
    header: 'Usage',
    cell: ({ row }) => {
      const code = row.original
      const usageText = code.usageLimit
        ? `${code.usageCount} / ${code.usageLimit}`
        : `${code.usageCount} (unlimited)`
      return h('span', { class: 'text-sm' }, usageText)
    }
  },
  {
    accessorKey: 'validity',
    header: 'Validity',
    cell: ({ row }) => {
      const code = row.original
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null
        return new Date(dateStr).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }

      const from = formatDate(code.validFrom)
      const to = formatDate(code.validTo)

      if (!from && !to) {
        return h('span', { class: 'text-sm text-muted' }, 'Always valid')
      }

      if (from && to) {
        return h('span', { class: 'text-sm' }, `${from} - ${to}`)
      }

      if (from) {
        return h('span', { class: 'text-sm' }, `From ${from}`)
      }

      return h('span', { class: 'text-sm' }, `Until ${to}`)
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium'
    }).format(new Date(row.original.createdAt))
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        UDropdownMenu,
        {
          items: getRowActions(row.original),
          content: { align: 'end' }
        },
        () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost'
          })
      )
  }
]

const sortItems = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Code A → Z', value: 'code-asc' },
  { label: 'Code Z → A', value: 'code-desc' },
  { label: 'Most used', value: 'usage' }
]

const statusItems = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Expired', value: 'expired' }
]

const pageSizeItems = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 }
]

function getRowActions(code: PromoCodeListItem) {
  return [
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(code)
    },
    {
      label: code.isActive ? 'Deactivate' : 'Activate',
      icon: code.isActive ? 'i-lucide-pause' : 'i-lucide-play',
      onSelect: () => toggleStatus(code)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => openDelete(code)
    }
  ]
}

function openCreate() {
  selectedCode.value = null
  createOpen.value = true
}

function openEdit(code: PromoCodeListItem) {
  selectedCode.value = code
  editOpen.value = true
}

function openDelete(code: PromoCodeListItem) {
  selectedCode.value = code
  deleteOpen.value = true
}

async function toggleStatus(code: PromoCodeListItem) {
  try {
    await $fetch(`/api/pricing/promo-codes/${code.id}`, {
      method: 'PATCH',
      body: { isActive: !code.isActive }
    })

    toast.add({
      title: code.isActive ? 'Promo code deactivated' : 'Promo code activated',
      description: `${code.code} has been ${code.isActive ? 'deactivated' : 'activated'}.`
    })

    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update status'
    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error'
    })
  }
}

async function handleCreate(values: PromoCodeEditorValues) {
  formLoading.value = true

  try {
    const response = await $fetch<{ promoCode: PromoCodeListItem }>('/api/pricing/promo-codes', {
      method: 'POST',
      body: values
    })

    toast.add({
      title: 'Promo code created',
      description: `${response.promoCode.code} is ready to use.`
    })

    createOpen.value = false
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create promo code'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    formLoading.value = false
  }
}

async function handleUpdate(values: PromoCodeEditorValues) {
  if (!selectedCode.value) {
    return
  }

  formLoading.value = true

  try {
    const response = await $fetch<{ promoCode: PromoCodeListItem }>(`/api/pricing/promo-codes/${selectedCode.value.id}`, {
      method: 'PATCH',
      body: values
    })

    toast.add({
      title: 'Promo code updated',
      description: `${response.promoCode.code} has been updated.`
    })

    editOpen.value = false
    selectedCode.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update promo code'
    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error'
    })
  } finally {
    formLoading.value = false
  }
}

async function confirmDelete() {
  if (!selectedCode.value) {
    return
  }

  deleteLoading.value = true

  try {
    await $fetch(`/api/pricing/promo-codes/${selectedCode.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Promo code deleted',
      description: `${selectedCode.value.code} has been removed.`
    })

    deleteOpen.value = false
    selectedCode.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to delete promo code'
    toast.add({
      title: 'Delete failed',
      description: message,
      color: 'error'
    })
  } finally {
    deleteLoading.value = false
  }
}

watch(createOpen, (open) => {
  if (!open) {
    formLoading.value = false
  }
})

watch(editOpen, (open) => {
  if (!open) {
    formLoading.value = false
    selectedCode.value = null
  }
})

watch(deleteOpen, (open) => {
  if (!open) {
    deleteLoading.value = false
    selectedCode.value = null
  }
})

function handleRefresh() {
  return refresh()
}
</script>

<template>
  <UDashboardPanel id="promo-codes">
    <template #header>
      <UDashboardNavbar title="Promo Codes">
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-ccw"
              color="neutral"
              variant="outline"
              :loading="status === 'pending'"
              @click="handleRefresh"
            />
            <UButton
              icon="i-lucide-ticket-plus"
              label="Add promo code"
              @click="openCreate"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search codes..."
        />

        <div class="flex flex-wrap items-center gap-2">
          <USelect
            v-model="statusFilter"
            :items="statusItems"
            class="min-w-32"
          />
          <USelect
            v-model="sort"
            :items="sortItems"
            class="min-w-40"
          />
          <USelect
            v-model="pageSize"
            :items="pageSizeItems"
            class="min-w-32"
          />
        </div>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Unable to load promo codes"
        :description="error.message"
        class="mt-4"
      />

      <UTable
        v-else
        class="mt-4"
        :data="promoCodes"
        :columns="columns"
        :loading="status === 'pending'"
      />

      <div
        v-if="totalPages > 1 || totalItems > pageSize"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4"
      >
        <p class="text-sm text-muted">
          Showing
          <span class="font-medium text-highlighted">{{ promoCodes.length }}</span>
          of
          <span class="font-medium text-highlighted">{{ totalItems }}</span>
          promo codes
        </p>

        <UPagination
          :page="page"
          :items-per-page="pageSize"
          :total="totalItems"
          @update:page="(next) => (page = next)"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Create Modal -->
  <UModal
    v-model:open="createOpen"
    title="New Promo Code"
    description="Create a discount code for customers."
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <PromoCodeEditorForm
        mode="create"
        :open="createOpen"
        :submitting="formLoading"
        @submit="handleCreate"
      />
    </template>
  </UModal>

  <!-- Edit Modal -->
  <UModal
    v-model:open="editOpen"
    title="Edit Promo Code"
    :description="selectedCode ? `Update settings for ${selectedCode.code}.` : 'Update promo code settings.'"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <PromoCodeEditorForm
        mode="edit"
        :open="editOpen"
        :initial-values="editInitialValues"
        :submitting="formLoading"
        @submit="handleUpdate"
      />
    </template>
  </UModal>

  <!-- Delete Confirmation Modal -->
  <UModal
    v-model:open="deleteOpen"
    :title="selectedCode ? `Delete ${selectedCode.code}?` : 'Delete promo code'"
    :description="selectedCode ? 'This action cannot be undone.' : undefined"
  >
    <template #body>
      <p class="text-sm text-muted">
        Are you sure you want to delete this promo code? Customers will no longer be able to use it.
      </p>

      <div class="mt-6 flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          :disabled="deleteLoading"
          @click="deleteOpen = false"
        />
        <UButton
          label="Delete code"
          color="error"
          variant="solid"
          :loading="deleteLoading"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
