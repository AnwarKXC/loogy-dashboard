<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { formatDistanceToNow } from 'date-fns'

import type {
  ProductFilterOption,
  ProductFiltersResponse,
  ProductInventoryStatus,
  ProductListItem,
  ProductListResponse
} from '~/types'
import { flattenCategoryTree } from '~/utils/categories'

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const categoryId = ref<number | null>(null)
const brandId = ref<number | null>(null)
const sort = ref<'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('newest')
const showArchived = ref(false)

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  search: search.value.trim() ? search.value.trim() : undefined,
  categoryId: categoryId.value ?? undefined,
  brandId: brandId.value ?? undefined,
  sort: sort.value,
  includeFilters: false,
  includeArchived: showArchived.value
}))

const { data, status, error, refresh } = await useFetch<ProductListResponse>('/api/products', {
  query,
  watch: [query]
})

const {
  data: filtersData,
  status: filtersStatus,
  error: filtersError
} = await useFetch<ProductFiltersResponse>('/api/products/filters')

watch([search, categoryId, brandId, sort], () => {
  page.value = 1
})

watch(pageSize, () => {
  page.value = 1
})

watch(
  () => data.value?.pagination.totalPages,
  (totalPages) => {
    if (!totalPages || totalPages < 1) {
      page.value = 1
      return
    }

    if (page.value > totalPages) {
      page.value = totalPages
    }
  }
)

const currencyFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 2
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

const statusColorMap: Record<ProductInventoryStatus, string> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
  archived: 'neutral'
}

const archivingProductId = ref<number | null>(null)
const archiveDialogOpen = ref(false)
const archiveCandidate = ref<ProductListItem | null>(null)
const archiveLoading = ref(false)

function getRowItems(product: ProductListItem) {
  const displayName = product.name || `Product #${product.id}`

  return [
    {
      type: 'label',
      label: displayName
    },
    {
      label: 'Open product',
      icon: 'i-lucide-external-link',
      onSelect: () => openProduct(product.id)
    },
    {
      label: 'Edit product',
      icon: 'i-lucide-pencil',
      onSelect: () => editProduct(product.id)
    },
    {
      type: 'separator'
    },
    {
      label: 'Duplicate',
      icon: 'i-lucide-copy',
      onSelect: () => duplicateProduct(product.id)
    },
    ...(!product.isArchived
      ? [{
          label: archivingProductId.value === product.id ? 'Archiving…' : 'Archive',
          icon: 'i-lucide-archive',
          disabled: archivingProductId.value === product.id,
          onSelect: () => archiveProduct(product)
        }]
      : [])
  ]
}

function handleCreateProduct() {
  navigateTo({ path: '/products/new' })
}

function openProduct(productId: number) {
  navigateTo({ path: `/products/${productId}` })
}

function editProduct(productId: number) {
  navigateTo({ path: `/products/${productId}/edit` })
}

function duplicateProduct(productId: number) {
  navigateTo({ path: '/products/new', query: { duplicateFrom: productId.toString() } })
}

function archiveProduct(product: ProductListItem) {
  archiveCandidate.value = product
  archiveDialogOpen.value = true
}

async function confirmArchive() {
  const product = archiveCandidate.value

  if (!product) {
    archiveDialogOpen.value = false
    return
  }

  archivingProductId.value = product.id
  archiveLoading.value = true

  try {
    await $fetch(`/api/products/${product.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Product archived',
      description: `${product.name || `Product #${product.id}`} has been archived.`
    })

    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to archive product'
    toast.add({
      title: 'Archive failed',
      description: message,
      color: 'error'
    })
  } finally {
    archivingProductId.value = null
    archiveLoading.value = false
    archiveDialogOpen.value = false
    archiveCandidate.value = null
  }
}

function cancelArchive() {
  archiveDialogOpen.value = false
}

function withFallback(option: ProductFilterOption | null, fallback: string) {
  return option?.name?.trim() ? option.name : fallback
}

const columns: TableColumn<ProductListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Product',
    cell: ({ row }) => {
      const product = row.original

      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: product.image ?? undefined,
          icon: 'i-lucide-image-off',
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted truncate max-w-[220px]' }, product.name || `Product #${product.id}`),
          h('p', { class: 'text-sm text-muted truncate max-w-[220px]' }, withFallback(product.category, 'Uncategorized'))
        ])
      ])
    }
  },
  {
    accessorKey: 'price',
    header: 'Pricing',
    cell: ({ row }) => {
      const product = row.original

      if (product.salePrice && product.salePrice < product.price) {
        return h('div', { class: 'flex flex-col text-sm' }, [
          h('span', { class: 'font-semibold text-success-600 dark:text-success-400' }, formatCurrency(product.salePrice)),
          h('span', { class: 'text-muted line-through' }, formatCurrency(product.price))
        ])
      }

      return h('span', { class: 'text-sm font-medium text-highlighted' }, formatCurrency(product.price))
    }
  },
  {
    accessorKey: 'status',
    header: 'Inventory',
    cell: ({ row }) => {
      const product = row.original

      return h(
        UBadge,
        {
          color: statusColorMap[product.status],
          variant: 'subtle',
          class: 'capitalize'
        },
        () => product.status.replace(/_/g, ' ')
      )
    }
  },
  {
    accessorKey: 'brand',
    header: 'Brand',
    cell: ({ row }) => withFallback(row.original.brand, 'No brand')
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last updated',
    cell: ({ row }) => formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true })
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        UDropdownMenu,
        {
          items: getRowItems(row.original),
          content: {
            align: 'end'
          }
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

const categoryTree = computed(() => filtersData.value?.categories ?? [])
const flattenedCategoryOptions = computed(() => flattenCategoryTree(categoryTree.value))

const categoryItems = computed(() => {
  return [
    { label: 'All categories', value: null },
    ...flattenedCategoryOptions.value.map(category => ({
      label: `${category.depth > 0 ? `${'- '.repeat(category.depth)} ` : ''}${category.name || `Category #${category.id}`}`,
      value: category.id
    }))
  ]
})

const brandItems = computed(() => {
  const options = filtersData.value?.brands ?? []

  return [
    { label: 'All brands', value: null },
    ...options.map(brand => ({
      label: brand.name || `Brand #${brand.id}`,
      value: brand.id
    }))
  ]
})

const sortItems = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Inventory: Low to High', value: 'stock-asc' },
  { label: 'Inventory: High to Low', value: 'stock-desc' }
]

const pageSizeItems = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 }
]

const products = computed(() => data.value?.items ?? [])
const totalItems = computed(() => data.value?.pagination.totalItems ?? 0)
const totalPages = computed(() => data.value?.pagination.totalPages ?? 0)
const filtersLoading = computed(() => filtersStatus.value === 'pending')

watch(showArchived, () => {
  page.value = 1
})

watch(archiveDialogOpen, (open) => {
  if (!open) {
    archiveLoading.value = false
    archiveCandidate.value = null
  }
})
</script>

<template>
  <UDashboardPanel id="products">
    <template #header>
      <UDashboardNavbar title="Products">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton label="Add product" icon="i-lucide-plus" @click="handleCreateProduct" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search products..."
        />

        <div class="flex flex-wrap items-center gap-2">
          <USelect
            v-model="categoryId"
            :items="categoryItems"
            placeholder="All categories"
            class="min-w-36"
            clearable
            :disabled="filtersLoading"
          />
          <USelect
            v-model="brandId"
            :items="brandItems"
            placeholder="All brands"
            class="min-w-32"
            clearable
            :disabled="filtersLoading"
          />
          <USelect
            v-model="sort"
            :items="sortItems"
            placeholder="Sort by"
            class="min-w-40"
          />
          <USelect
            v-model="pageSize"
            :items="pageSizeItems"
            class="min-w-32"
          />
          <UCheckbox
            v-model="showArchived"
            label="Show archived"
            class="pl-2"
          />
        </div>
      </div>

      <UAlert
        v-if="filtersError"
        color="warning"
        variant="subtle"
        title="Filters unavailable"
        :description="filtersError.message"
        class="mt-4"
      />

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Unable to load products"
        :description="error.message"
        class="mt-4"
      />

      <UTable
        v-else
        class="mt-4"
        :data="products"
        :columns="columns"
        :loading="status === 'pending'"
      />

      <div
        v-if="totalPages > 1 || totalItems > pageSize"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
      >
        <p class="text-sm text-muted">
          Showing
          <span class="font-medium text-highlighted">{{ products.length }}</span>
          of
          <span class="font-medium text-highlighted">{{ totalItems }}</span>
          products
        </p>

        <div class="flex items-center gap-2">
          <UPagination
            :page="page"
            :items-per-page="pageSize"
            :total="totalItems"
            @update:page="(next) => (page = next)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="archiveDialogOpen"
    :title="archiveCandidate ? `Archive ${archiveCandidate.name || `Product #${archiveCandidate.id}`}` : 'Archive product'"
    :description="archiveCandidate ? `This will hide ${archiveCandidate.name || `Product #${archiveCandidate.id}`} from listings. You can restore it later.` : 'This will hide the selected product from listings. You can restore it later.'"
  >
    <template #body>
      <p class="text-sm text-muted">
        Archived products remain in the catalog but stop appearing in listings and searches. You can unarchive them from the product detail page when needed.
      </p>

      <div class="mt-6 flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          :disabled="archiveLoading"
          @click="cancelArchive"
        />
        <UButton
          label="Archive product"
          color="error"
          variant="solid"
          :loading="archiveLoading"
          @click="confirmArchive"
        />
      </div>
    </template>
  </UModal>
</template>
