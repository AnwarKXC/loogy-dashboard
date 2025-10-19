<script setup lang="ts">
import { format } from 'date-fns'
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import type { OrderListItem, OrderListResponse } from '~/types'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

const toast = useToast()

const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const statusFilter = ref<string | null>(null)
const paymentFilter = ref<string | null>(null)
const sort = ref<'newest' | 'oldest' | 'total-asc' | 'total-desc'>('newest')

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  search: search.value.trim() ? search.value.trim() : undefined,
  status: statusFilter.value ?? undefined,
  paymentMethod: paymentFilter.value ?? undefined,
  sort: sort.value
}))

const { data, status, error, refresh } = await useFetch<OrderListResponse>('/api/orders', {
  query,
  watch: [query]
})

watch([statusFilter, paymentFilter, sort, pageSize], () => {
  page.value = 1
})

watch(search, () => {
  page.value = 1
})

const orders = computed(() => data.value?.items ?? [])
const totalItems = computed(() => data.value?.pagination.totalItems ?? 0)
const totalPages = computed(() => data.value?.pagination.totalPages ?? 0)

const columns: TableColumn<OrderListItem>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order',
    cell: ({ row }) => h('span', { class: 'font-semibold text-highlighted' }, row.original.orderNumber)
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => h('span', { class: 'text-sm text-highlighted' }, row.original.customerName)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        variant: 'subtle',
        color: getStatusColor(row.original.status),
        class: 'uppercase tracking-wide text-xs'
      }, () => row.original.status)
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment',
    cell: ({ row }) => h('span', { class: 'text-xs font-medium text-muted uppercase' }, formatPaymentMethod(row.original.paymentMethod))
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, formatCurrency(row.original.totalAmount))
  },
  {
    accessorKey: 'createdAt',
    header: 'Placed on',
    cell: ({ row }) => formatOrderDate(row.original.createdAt)
  },
  {
    id: 'actions',
    header: '',
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

function getStatusColor(status: OrderListItem['status']) {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'SHIPPING':
      return 'primary'
    case 'DELIVERED':
      return 'success'
    default:
      return 'neutral'
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2
  }).format(amount)
}

function formatPaymentMethod(value: string) {
  return value.replace(/_/g, ' ')
}

function formatOrderDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, hh:mm a')
}

function getRowItems(order: OrderListItem) {
  return [
    {
      label: 'Open order',
      icon: 'i-lucide-external-link',
      onSelect: () => openOrder(order.id)
    },
    {
      label: 'Mark as shipping',
      icon: 'i-lucide-truck',
      disabled: order.status !== 'PENDING',
      onSelect: () => updateStatus(order.id, 'SHIPPING')
    },
    {
      label: 'Mark as delivered',
      icon: 'i-lucide-badge-check',
      disabled: order.status === 'DELIVERED',
      onSelect: () => updateStatus(order.id, 'DELIVERED')
    }
  ]
}

async function updateStatus(orderId: number, status: OrderListItem['status']) {
  try {
    await $fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: { status }
    })

    toast.add({
      title: 'Order updated',
      description: `Order #${orderId} marked as ${status.toLowerCase()}.`
    })

    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update order'
    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error'
    })
  }
}

function openOrder(orderId: number) {
  navigateTo({ path: `/orders/${orderId}` })
}

const statusItems = [
  { label: 'All statuses', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Shipping', value: 'SHIPPING' },
  { label: 'Delivered', value: 'DELIVERED' }
]

const paymentItems = [
  { label: 'All payment methods', value: null },
  { label: 'Cash', value: 'CASH' },
  { label: 'Vodafone Cash', value: 'VODAFONE_CASH' },
  { label: 'Instapay', value: 'INSTAPAY' },
  { label: 'Visa', value: 'VISA' }
]

const sortItems = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Total: Low to High', value: 'total-asc' },
  { label: 'Total: High to Low', value: 'total-desc' }
]

const pageSizeItems = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 }
]

function handleRefresh() {
  return refresh()
}
</script>

<template>
  <UDashboardPanel id="orders">
    <template #header>
      <UDashboardNavbar title="Orders">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-ccw"
            color="neutral"
            variant="outline"
            :loading="status === 'pending'"
            @click="handleRefresh"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search orders..."
        />

        <div class="flex flex-wrap items-center gap-2">
          <USelect
            v-model="statusFilter"
            :items="statusItems"
            class="min-w-36"
          />
          <USelect
            v-model="paymentFilter"
            :items="paymentItems"
            class="min-w-40"
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
        title="Unable to load orders"
        :description="error?.message ?? 'Something went wrong'"
        class="mt-4"
      />

      <UTable
        v-else
        class="mt-4"
        :data="orders"
        :columns="columns"
        :loading="status === 'pending'"
      />

      <div
        v-if="totalPages > 1 || totalItems > pageSize"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4"
      >
        <p class="text-sm text-muted">
          Showing
          <span class="font-medium text-highlighted">{{ orders.length }}</span>
          of
          <span class="font-medium text-highlighted">{{ totalItems }}</span>
          orders
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
</template>
