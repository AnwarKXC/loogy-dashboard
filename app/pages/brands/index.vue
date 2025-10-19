<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import BrandEditorForm from '~/components/brands/BrandEditorForm.vue'
import type { BrandEditorValues, BrandListItem, BrandListResponse } from '~/types'

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const sort = ref<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest')

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  search: search.value.trim() ? search.value.trim() : undefined,
  sort: sort.value
}))

const { data, status, error, refresh } = await useFetch<BrandListResponse>('/api/brands', {
  query,
  watch: [query]
})

watch([pageSize, sort], () => {
  page.value = 1
})

watch(search, (value, previous) => {
  if (value.length === 0 && previous.length > 0) {
    page.value = 1
  }
})

const brands = computed(() => data.value?.items ?? [])
const totalItems = computed(() => data.value?.pagination.totalItems ?? 0)
const totalPages = computed(() => data.value?.pagination.totalPages ?? 0)

const createOpen = ref(false)
const editOpen = ref(false)
const deleteOpen = ref(false)
const formLoading = ref(false)
const deleteLoading = ref(false)

const selectedBrand = ref<BrandListItem | null>(null)

const editInitialValues = computed<Partial<BrandEditorValues>>(() => {
  if (!selectedBrand.value) {
    return {}
  }

  return {
    nameEn: selectedBrand.value.translations.en ?? selectedBrand.value.name,
    nameAr: selectedBrand.value.translations.ar,
    logo: selectedBrand.value.logo
  }
})

const columns: TableColumn<BrandListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Brand',
    cell: ({ row }) => {
      const brand = row.original
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: brand.logo ?? undefined,
          icon: 'i-lucide-badge-check',
          size: '2xl',
          ui: {
            image: 'object-contain ',
            root: 'drop-shadow '
          }
        }),
        h('div', undefined, [
          h('p', { class: 'text-sm font-semibold text-highlighted truncate max-w-[220px]' }, brand.name),
          h('p', { class: 'text-xs text-muted' }, `Slug: ${brand.slug}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'productCount',
    header: 'Products',
    cell: ({ row }) => h(UBadge, { variant: 'subtle' }, () => row.original.productCount.toString())
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last updated',
    cell: ({ row }) => new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(row.original.updatedAt))
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
  { label: 'Name A → Z', value: 'name-asc' },
  { label: 'Name Z → A', value: 'name-desc' }
]

const pageSizeItems = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 }
]

function getRowActions(brand: BrandListItem) {
  return [
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(brand)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => openDelete(brand)
    }
  ]
}

function openCreate() {
  selectedBrand.value = null
  createOpen.value = true
}

function openEdit(brand: BrandListItem) {
  selectedBrand.value = brand
  editOpen.value = true
}

function openDelete(brand: BrandListItem) {
  selectedBrand.value = brand
  deleteOpen.value = true
}

async function handleCreate(values: BrandEditorValues) {
  formLoading.value = true

  try {
    const response = await $fetch<{ brand: BrandListItem }>('/api/brands', {
      method: 'POST',
      body: values
    })

    toast.add({
      title: 'Brand created',
      description: `${response.brand.name} is ready.`
    })

    createOpen.value = false
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create brand'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    formLoading.value = false
  }
}

async function handleUpdate(values: BrandEditorValues) {
  if (!selectedBrand.value) {
    return
  }

  formLoading.value = true

  try {
    const response = await $fetch<{ brand: BrandListItem }>(`/api/brands/${selectedBrand.value.id}`, {
      method: 'PATCH',
      body: values
    })

    toast.add({
      title: 'Brand updated',
      description: `${response.brand.name} is up to date.`
    })

    editOpen.value = false
    selectedBrand.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update brand'
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
  if (!selectedBrand.value) {
    return
  }

  deleteLoading.value = true

  try {
    const response = await $fetch<{ brand: BrandListItem }>(`/api/brands/${selectedBrand.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Brand deleted',
      description: `${response.brand.name} was removed.`
    })

    deleteOpen.value = false
    selectedBrand.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to delete brand'
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
    selectedBrand.value = null
  }
})

watch(deleteOpen, (open) => {
  if (!open) {
    deleteLoading.value = false
    selectedBrand.value = null
  }
})

function handleRefresh() {
  return refresh()
}
</script>

<template>
  <UDashboardPanel id="brands">
    <template #header>
      <UDashboardNavbar title="Brands">
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
            <UButton
              icon="i-lucide-badge-plus"
              label="Add brand"
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
          placeholder="Search brands..."
        />

        <div class="flex flex-wrap items-center gap-2">
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
        title="Unable to load brands"
        :description="error.message"
        class="mt-4"
      />

      <UTable
        v-else
        class="mt-4"
        :data="brands"
        :columns="columns"
        :loading="status === 'pending'"
      />

      <div
        v-if="totalPages > 1 || totalItems > pageSize"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4"
      >
        <p class="text-sm text-muted">
          Showing
          <span class="font-medium text-highlighted">{{ brands.length }}</span>
          of
          <span class="font-medium text-highlighted">{{ totalItems }}</span>
          brands
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

  <UModal
    v-model:open="createOpen"
    title="New brand"
    description="Create a brand for product assignment."
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <BrandEditorForm
        mode="create"
        :open="createOpen"
        :submitting="formLoading"
        @submit="handleCreate"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="editOpen"
    title="Edit brand"
    :description="selectedBrand ? `Update details for ${selectedBrand.name}.` : 'Update brand details.'"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <BrandEditorForm
        mode="edit"
        :open="editOpen"
        :initial-values="editInitialValues"
        :submitting="formLoading"
        @submit="handleUpdate"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="deleteOpen"
    :title="selectedBrand ? `Delete ${selectedBrand.name}?` : 'Delete brand'"
    :description="selectedBrand ? 'Ensure no products reference this brand before deleting.' : undefined"
  >
    <template #body>
      <p class="text-sm text-muted">
        This action cannot be undone. Products associated with this brand must be reassigned before deletion.
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
          label="Delete brand"
          color="error"
          variant="solid"
          :loading="deleteLoading"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
