<script setup lang="ts">
import { format, formatDistanceToNow } from 'date-fns'
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import type { CustomerListItem, CustomerListResponse } from '~/types'

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const table = useTemplateRef('table')

const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const statusFilter = ref<'all' | 'ACTIVE' | 'INACTIVE'>('all')
const sort = ref<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'orders-desc'>('newest')

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  search: search.value.trim() ? search.value.trim() : undefined,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  sort: sort.value
}))

const { data, status, error, refresh } = await useFetch<CustomerListResponse>('/api/customers', {
  lazy: true,
  query,
  watch: [query]
})

watch([statusFilter, sort, pageSize], () => {
  page.value = 1
})

watch(search, () => {
  page.value = 1
})

const customers = computed(() => data.value?.items ?? [])
const totalItems = computed(() => data.value?.pagination.totalItems ?? 0)
const totalPages = computed(() => data.value?.pagination.totalPages ?? 0)

const rowSelection = ref<Record<string, boolean>>({})

const columns: TableColumn<CustomerListItem>[] = [
  {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => `#${row.original.id}`
  },
  {
    accessorKey: 'name',
    header: 'Customer',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          text: getInitials(row.original.name),
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-sm text-muted' }, row.original.email)
        ])
      ])
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    cell: ({ row }) => row.original.phoneNumber ?? '—'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'tracking-wide text-xs',
        variant: 'subtle',
        color: getStatusColor(row.original.status)
      }, () => formatStatus(row.original.status))
  },
  {
    accessorKey: 'ordersCount',
    header: 'Orders',
    cell: ({ row }) => row.original.ordersCount.toString()
  },
  {
    accessorKey: 'lastSession',
    header: 'Last session',
    cell: ({ row }) => formatLastSeen(row.original.lastSession)
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => formatJoined(row.original.createdAt)
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      h(
        UDropdownMenu,
        {
          items: getRowItems(row.original),
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

const statusItems = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
]

const sortItems = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Name A–Z', value: 'name-asc' },
  { label: 'Name Z–A', value: 'name-desc' },
  { label: 'Most orders', value: 'orders-desc' }
]

const pageSizeItems = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 }
]

const selectedCustomerIds = computed(() =>
  table.value?.tableApi?.getSelectedRowModel().rows.map(row => row.original.id) ?? []
)

const selectedCount = computed(() => selectedCustomerIds.value.length)

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || 'CU'
}

function getStatusColor(status: CustomerListItem['status']) {
  return status === 'ACTIVE' ? 'success' : 'error'
}

function formatStatus(status: CustomerListItem['status']) {
  return status === 'ACTIVE' ? 'Active' : 'Inactive'
}

function formatLastSeen(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

function formatJoined(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy')
}

function getRowItems(customer: CustomerListItem) {
  return [
    {
      label: 'Copy customer ID',
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(customer.id.toString())
        toast.add({
          title: 'Copied',
          description: `Customer #${customer.id} copied to clipboard.`
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Send email',
      icon: 'i-lucide-mail'
    },
    {
      label: 'View orders',
      icon: 'i-lucide-clipboard-list'
    },
    {
      type: 'separator'
    },
    {
      label: customer.status === 'ACTIVE' ? 'Deactivate' : 'Activate',
      icon: customer.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check',
      onSelect: () => toggleStatus(customer)
    }
  ]
}

async function toggleStatus(customer: CustomerListItem) {
  try {
    const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    await $fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    toast.add({
      title: 'Status updated',
      description: `${customer.name} is now ${formatStatus(nextStatus)}.`,
      color: nextStatus === 'ACTIVE' ? 'success' : 'neutral'
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

function handleRefresh() {
  return refresh()
}

async function handleCreated() {
  page.value = 1
  await refresh()
}

async function handleDeleted(deletedCount: number) {
  rowSelection.value = {}

  if (customers.value.length <= deletedCount && page.value > 1) {
    page.value = Math.max(1, page.value - 1)
  }

  await refresh()
}
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-ccw"
              color="neutral"
              variant="outline"
              :loading="status === 'pending'"
              @click="handleRefresh"
            />
            <CustomersAddModal @created="handleCreated" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search customers..."
        />

        <div class="flex flex-wrap items-center gap-2">
          <CustomersDeleteModal
            :count="selectedCount"
            :ids="selectedCustomerIds"
            @deleted="handleDeleted"
          >
            <UButton
              v-if="selectedCount"
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>{{ selectedCount }}</UKbd>
              </template>
            </UButton>
          </CustomersDeleteModal>

          <USelect
            v-model="statusFilter"
            :items="statusItems"
            class="min-w-32"
          />

          <USelect
            v-model="sort"
            :items="sortItems"
            class="min-w-36"
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
        title="Unable to load customers"
        :description="error?.message ?? 'Something went wrong'"
        class="mt-4"
      />

      <UTable
        v-else
        ref="table"
        v-model:row-selection="rowSelection"
        class="mt-4 shrink-0"
        :data="customers"
        :columns="columns"
        :loading="status === 'pending'"
      />

      <div
        v-if="totalPages > 1 || totalItems > pageSize"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4"
      >
        <p class="text-sm text-muted">
          Showing
          <span class="font-medium text-highlighted">{{ customers.length }}</span>
          of
          <span class="font-medium text-highlighted">{{ totalItems }}</span>
          customers
        </p>

        <UPagination
          :page="page"
          :items-per-page="pageSize"
          :total="totalItems"
          @update:page="(next: number) => (page = next)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
