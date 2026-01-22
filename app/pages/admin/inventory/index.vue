<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

type InventoryItem = {
  id: number
  slug: string
  name: string
  image: string | null
  stock: number
  variantStock: number
  totalStock: number
  status: 'out_of_stock' | 'low_stock' | 'in_stock'
  price: number
  salePrice: number | null
  isPublished: boolean
  categoryId: number | null
  categoryName: string | null
  brandId: number | null
  brandName: string | null
  variants: { id: number, sku: string | null, stock: number, attributes: unknown }[]
  updatedAt: string
}

type Stats = {
  totalProducts: number
  totalStock: number
  averageStock: number
  outOfStock: number
  lowStock: number
  inStock: number
  lowStockThreshold: number
}

type InventoryResponse = {
  inventory: InventoryItem[]
  stats: Stats
  pagination: { total: number, page: number, limit: number, totalPages: number }
}

const toast = useToast()
const route = useRoute()
const router = useRouter()

// Query params
const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (val) => {
    router.push({ query: { ...route.query, page: val } })
  }
})

const filter = computed({
  get: () => route.query.filter as string | undefined,
  set: (val) => {
    router.push({ query: { ...route.query, filter: val, page: 1 } })
  }
})

const search = ref('')
const lowStockThreshold = ref(10)

const { data, refresh, status } = await useFetch<InventoryResponse>('/api/inventory', {
  query: computed(() => ({
    page: page.value,
    limit: 50,
    search: search.value || undefined,
    outOfStockOnly: filter.value === 'out_of_stock' ? 'true' : undefined,
    lowStockThreshold: lowStockThreshold.value
  }))
})

const inventory = computed(() => data.value?.inventory ?? [])
const stats = computed(() => data.value?.stats ?? {
  totalProducts: 0,
  totalStock: 0,
  averageStock: 0,
  outOfStock: 0,
  lowStock: 0,
  inStock: 0,
  lowStockThreshold: 10
})
const pagination = computed(() => data.value?.pagination ?? { total: 0, page: 1, limit: 50, totalPages: 1 })

// Stock adjustment modal
const isModalOpen = ref(false)
const editingProduct = ref<InventoryItem | null>(null)
const newStock = ref(0)
const adjustmentNote = ref('')
const saving = ref(false)

function openStockModal(product: InventoryItem) {
  editingProduct.value = product
  newStock.value = product.stock
  adjustmentNote.value = ''
  isModalOpen.value = true
}

async function saveStock() {
  if (!editingProduct.value) return

  saving.value = true
  try {
    await $fetch(`/api/inventory/${editingProduct.value.id}`, {
      method: 'PATCH',
      body: {
        stock: newStock.value,
        note: adjustmentNote.value || undefined
      }
    })
    toast.add({
      title: 'Stock updated',
      description: `${editingProduct.value.name} stock set to ${newStock.value}`,
      color: 'success'
    })
    isModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update stock'
    toast.add({ title: 'Error', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

function getStatusColor(status: string): 'error' | 'warning' | 'success' {
  switch (status) {
    case 'out_of_stock': return 'error'
    case 'low_stock': return 'warning'
    default: return 'success'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'out_of_stock': return 'Out of Stock'
    case 'low_stock': return 'Low Stock'
    default: return 'In Stock'
  }
}

const columns: TableColumn<InventoryItem>[] = [
  {
    accessorKey: 'image',
    header: '',
    cell: ({ row }) => h(UAvatar, {
      src: row.original.image ?? undefined,
      alt: row.original.name,
      size: 'md',
      icon: 'i-lucide-package'
    })
  },
  {
    accessorKey: 'name',
    header: 'Product',
    cell: ({ row }) => h('div', {}, [
      h('p', { class: 'font-medium' }, row.original.name),
      h('p', { class: 'text-xs text-gray-500' }, row.original.slug)
    ])
  },
  {
    accessorKey: 'categoryName',
    header: 'Category',
    cell: ({ row }) => row.original.categoryName ?? '-'
  },
  {
    accessorKey: 'totalStock',
    header: 'Stock',
    cell: ({ row }) => h('div', { class: 'text-right' }, [
      h('p', { class: 'font-semibold text-lg' }, row.original.totalStock.toString()),
      row.original.variantStock > 0
        ? h('p', { class: 'text-xs text-gray-500' }, `+${row.original.variantStock} in variants`)
        : null
    ])
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: getStatusColor(row.original.status),
      variant: 'subtle'
    }, () => getStatusLabel(row.original.status))
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => h('div', { class: 'text-right' }, [
      row.original.salePrice
        ? h('p', { class: 'font-medium text-green-600' }, `${row.original.salePrice} EGP`)
        : h('p', { class: 'font-medium' }, `${row.original.price} EGP`),
      row.original.salePrice
        ? h('p', { class: 'text-xs text-gray-400 line-through' }, `${row.original.price} EGP`)
        : null
    ])
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex gap-2 justify-end' }, [
      h(UButton, {
        icon: 'i-lucide-edit',
        size: 'xs',
        variant: 'ghost',
        title: 'Adjust Stock',
        onClick: () => openStockModal(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-external-link',
        size: 'xs',
        variant: 'ghost',
        title: 'View Product',
        to: `/admin/products/${row.original.id}`
      })
    ])
  }
]

const filterOptions = [
  { label: 'All Products', value: undefined },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Low Stock', value: 'low_stock' }
]
</script>

<template>
  <UDashboardPanel id="inventory">
    <template #header>
      <UDashboardNavbar title="Inventory Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search products..."
            class="w-64"
            @keyup.enter="refresh"
          />
          <USelect
            v-model="filter"
            :items="filterOptions"
            placeholder="Filter"
            class="w-40"
          />
          <UButton
            icon="i-lucide-history"
            variant="outline"
            to="/admin/inventory/history"
          >
            History
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <UCard class="text-center">
            <p class="text-2xl font-bold">
              {{ stats.totalProducts }}
            </p>
            <p class="text-xs text-gray-500">
              Total Products
            </p>
          </UCard>
          <UCard class="text-center">
            <p class="text-2xl font-bold">
              {{ stats.totalStock }}
            </p>
            <p class="text-xs text-gray-500">
              Total Units
            </p>
          </UCard>
          <UCard class="text-center">
            <p class="text-2xl font-bold">
              {{ stats.averageStock }}
            </p>
            <p class="text-xs text-gray-500">
              Avg Stock/Product
            </p>
          </UCard>
          <UCard
            class="text-center cursor-pointer hover:ring-2 ring-red-500 transition-all"
            :class="{ 'ring-2 ring-red-500': filter === 'out_of_stock' }"
            @click="filter = filter === 'out_of_stock' ? undefined : 'out_of_stock'"
          >
            <p class="text-2xl font-bold text-red-600">
              {{ stats.outOfStock }}
            </p>
            <p class="text-xs text-gray-500">
              Out of Stock
            </p>
          </UCard>
          <UCard
            class="text-center cursor-pointer hover:ring-2 ring-yellow-500 transition-all"
            :class="{ 'ring-2 ring-yellow-500': filter === 'low_stock' }"
            @click="filter = filter === 'low_stock' ? undefined : 'low_stock'"
          >
            <p class="text-2xl font-bold text-yellow-600">
              {{ stats.lowStock }}
            </p>
            <p class="text-xs text-gray-500">
              Low Stock (&lt;{{ stats.lowStockThreshold }})
            </p>
          </UCard>
          <UCard class="text-center">
            <p class="text-2xl font-bold text-green-600">
              {{ stats.inStock }}
            </p>
            <p class="text-xs text-gray-500">
              In Stock
            </p>
          </UCard>
        </div>

        <!-- Inventory Table -->
        <USkeleton v-if="status === 'pending'" class="h-96 w-full" />

        <UTable
          v-else
          :data="inventory"
          :columns="columns"
          class="w-full"
        />

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center mt-6">
          <UPagination v-model="page" :total="pagination.total" :items-per-page="50" />
        </div>
      </div>
    </template>

    <!-- Stock Adjustment Modal -->
    <UModal v-model:open="isModalOpen" title="Adjust Stock">
      <template #body>
        <div v-if="editingProduct" class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <UAvatar
              :src="editingProduct.image ?? undefined"
              :alt="editingProduct.name"
              size="lg"
            />
            <div>
              <p class="font-medium">
                {{ editingProduct.name }}
              </p>
              <p class="text-sm text-gray-500">
                Current stock: {{ editingProduct.stock }}
              </p>
            </div>
          </div>

          <UFormField label="New Stock Quantity">
            <UInput
              v-model.number="newStock"
              type="number"
              min="0"
              placeholder="Enter new stock"
            />
          </UFormField>

          <div class="flex items-center gap-2 text-sm">
            <span>Change:</span>
            <UBadge
              :color="newStock > editingProduct.stock ? 'success' : newStock < editingProduct.stock ? 'error' : 'neutral'"
            >
              {{ newStock >= editingProduct.stock ? '+' : '' }}{{ newStock - editingProduct.stock }}
            </UBadge>
          </div>

          <UFormField label="Note (optional)">
            <UTextarea
              v-model="adjustmentNote"
              placeholder="Reason for adjustment (e.g., Restock, Damaged goods)"
              :rows="2"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="isModalOpen = false">
            Cancel
          </UButton>
          <UButton :loading="saving" @click="saveStock">
            Save
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
