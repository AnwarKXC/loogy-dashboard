<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

const UBadge = resolveComponent('UBadge')

type HistoryItem = {
  id: number
  productId: number
  productName: string
  productSlug: string
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE'
  quantity: number
  previousQty: number
  newQty: number
  orderId: number | null
  note: string | null
  createdAt: string
}

type HistoryResponse = {
  history: HistoryItem[]
  pagination: { total: number, page: number, limit: number, totalPages: number }
}

const route = useRoute()
const router = useRouter()

// Query params
const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (val) => {
    router.push({ query: { ...route.query, page: val } })
  }
})

const typeFilter = computed({
  get: () => route.query.type as string | undefined,
  set: (val) => {
    router.push({ query: { ...route.query, type: val, page: 1 } })
  }
})

const { data, status } = await useFetch<HistoryResponse>('/api/inventory/history', {
  query: computed(() => ({
    page: page.value,
    limit: 50,
    type: typeFilter.value || undefined
  }))
})

const history = computed(() => data.value?.history ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, page: 1, limit: 50, totalPages: 1 })

function getTypeColor(type: string): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  switch (type) {
    case 'SALE': return 'info'
    case 'RESTOCK': return 'success'
    case 'RETURN': return 'warning'
    case 'DAMAGE': return 'error'
    default: return 'neutral'
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'SALE': return 'i-lucide-shopping-cart'
    case 'RESTOCK': return 'i-lucide-package-plus'
    case 'RETURN': return 'i-lucide-undo'
    case 'DAMAGE': return 'i-lucide-alert-triangle'
    default: return 'i-lucide-edit'
  }
}

const typeOptions = [
  { label: 'All Types', value: undefined },
  { label: 'Sales', value: 'SALE' },
  { label: 'Restocks', value: 'RESTOCK' },
  { label: 'Returns', value: 'RETURN' },
  { label: 'Damage', value: 'DAMAGE' },
  { label: 'Adjustments', value: 'ADJUSTMENT' }
]

const columns: TableColumn<HistoryItem>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
  },
  {
    accessorKey: 'productName',
    header: 'Product',
    cell: ({ row }) => h('a', {
      href: `/admin/products/${row.original.productId}`,
      class: 'text-primary-500 hover:underline font-medium'
    }, row.original.productName)
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => h(UBadge, {
      color: getTypeColor(row.original.type),
      variant: 'subtle',
      icon: getTypeIcon(row.original.type)
    }, () => row.original.type)
  },
  {
    accessorKey: 'quantity',
    header: 'Change',
    cell: ({ row }) => h('span', {
      class: row.original.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
    }, `${row.original.quantity > 0 ? '+' : ''}${row.original.quantity}`)
  },
  {
    id: 'stockChange',
    header: 'Stock',
    cell: ({ row }) => h('span', { class: 'text-gray-500' },
      `${row.original.previousQty} → ${row.original.newQty}`
    )
  },
  {
    accessorKey: 'orderId',
    header: 'Order',
    cell: ({ row }) => row.original.orderId
      ? h('a', {
          href: `/admin/orders/${row.original.orderId}`,
          class: 'text-primary-500 hover:underline'
        }, `#${row.original.orderId}`)
      : '-'
  },
  {
    accessorKey: 'note',
    header: 'Note',
    cell: ({ row }) => row.original.note ?? '-'
  }
]
</script>

<template>
  <UDashboardPanel id="inventory-history">
    <template #header>
      <UDashboardNavbar title="Inventory History">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <USelect
            v-model="typeFilter"
            :items="typeOptions"
            placeholder="Filter by type"
            class="w-40"
          />
          <UButton
            icon="i-lucide-arrow-left"
            variant="outline"
            to="/admin/inventory"
          >
            Back to Inventory
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4">
        <USkeleton v-if="status === 'pending'" class="h-96 w-full" />

        <div v-else-if="history.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-history" class="text-4xl text-gray-400 mb-2" />
          <p class="text-gray-500">
            No inventory movements found
          </p>
        </div>

        <UTable
          v-else
          :data="history"
          :columns="columns"
          class="w-full"
        />

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center mt-6">
          <UPagination v-model="page" :total="pagination.total" :items-per-page="50" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
