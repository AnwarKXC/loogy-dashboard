<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import CategoryEditorForm from '~/components/categories/CategoryEditorForm.vue'
import type { CategoryEditorValues, CategoryListResponse } from '~/types'
import type { FlattenedCategory } from '~/utils/categories'
import { flattenCategoryTree } from '~/utils/categories'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const { data, status, error, refresh } = await useFetch<CategoryListResponse>('/api/categories')

const createOpen = ref(false)
const editOpen = ref(false)
const deleteOpen = ref(false)
const formLoading = ref(false)
const deleteLoading = ref(false)

const selectedCategory = ref<FlattenedCategory | null>(null)

const categories = computed(() => data.value?.categories ?? [])
const flattenedCategories = computed<FlattenedCategory[]>(() => flattenCategoryTree(categories.value))

const editInitialValues = computed<Partial<CategoryEditorValues>>(() => {
  if (!selectedCategory.value) {
    return {}
  }

  return {
    nameEn: selectedCategory.value.translations.en ?? selectedCategory.value.name,
    nameAr: selectedCategory.value.translations.ar ?? '',
    parentId: selectedCategory.value.parentId
  }
})

const editDisabledIds = computed(() => {
  const target = selectedCategory.value

  if (!target) {
    return [] as number[]
  }

  return flattenedCategories.value
    .filter(category => category.id === target.id || category.path.startsWith(`${target.path} /`))
    .map(category => category.id)
})

const columns: TableColumn<FlattenedCategory>[] = [
  {
    accessorKey: 'name',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.original

      return h('div', {
        class: 'flex items-center gap-2 text-sm text-highlighted',
        style: {
          paddingInlineStart: `${category.depth * 16}px`
        }
      }, [
        h('span', { class: 'i-lucide-folder w-4 h-4 text-muted shrink-0' }),
        h('span', { class: 'font-medium truncate max-w-[240px]' }, category.name)
      ])
    }
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted font-mono' }, row.original.slug)
  },
  {
    accessorKey: 'productCount',
    header: 'Products',
    cell: ({ row }) => h('span', { class: 'text-sm text-highlighted' }, row.original.productCount.toString())
  },
  {
    accessorKey: 'childCount',
    header: 'Subcategories',
    cell: ({ row }) => h('span', { class: 'text-sm text-highlighted' }, row.original.childCount.toString())
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

function getRowActions(category: FlattenedCategory) {
  return [
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(category)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => openDelete(category)
    }
  ]
}

function openCreate() {
  selectedCategory.value = null
  createOpen.value = true
}

function openEdit(category: FlattenedCategory) {
  selectedCategory.value = category
  editOpen.value = true
}

function openDelete(category: FlattenedCategory) {
  selectedCategory.value = category
  deleteOpen.value = true
}

async function handleCreate(values: CategoryEditorValues) {
  formLoading.value = true

  try {
    const response = await $fetch<{ category: { name: string } }>('/api/categories', {
      method: 'POST',
      body: values
    })

    toast.add({
      title: 'Category created',
      description: `${response.category.name} is ready.`
    })

    createOpen.value = false
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create category'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    formLoading.value = false
  }
}

async function handleUpdate(values: CategoryEditorValues) {
  if (!selectedCategory.value) {
    return
  }

  formLoading.value = true

  try {
    const response = await $fetch<{ category: { name: string } }>(`/api/categories/${selectedCategory.value.id}`, {
      method: 'PATCH',
      body: values
    })

    toast.add({
      title: 'Category updated',
      description: `${response.category.name} is up to date.`
    })

    editOpen.value = false
    selectedCategory.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update category'
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
  if (!selectedCategory.value) {
    return
  }

  deleteLoading.value = true

  try {
    const response = await $fetch<{ category: { name: string } }>(`/api/categories/${selectedCategory.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Category deleted',
      description: `${response.category.name} was removed.`
    })

    deleteOpen.value = false
    selectedCategory.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to delete category'
    toast.add({
      title: 'Delete failed',
      description: message,
      color: 'error'
    })
  } finally {
    deleteLoading.value = false
  }
}

function handleRefresh() {
  return refresh()
}

watch(createOpen, (open) => {
  if (!open) {
    formLoading.value = false
  }
})

watch(editOpen, (open) => {
  if (!open) {
    formLoading.value = false
    selectedCategory.value = null
  }
})

watch(deleteOpen, (open) => {
  if (!open) {
    deleteLoading.value = false
    selectedCategory.value = null
  }
})
</script>

<template>
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar title="Categories">
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
              icon="i-lucide-folder-plus"
              label="Add category"
              @click="openCreate"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Unable to load categories"
        :description="error.message"
        class="mb-4"
      />

      <UTable
        :data="flattenedCategories"
        :columns="columns"
        :loading="status === 'pending'"
      />

      <div
        v-if="flattenedCategories.length === 0 && status !== 'pending' && !error"
        class="mt-6 rounded-lg border border-dashed border-default px-6 py-12 text-center"
      >
        <p class="font-medium text-highlighted">
          No categories yet
        </p>
        <p class="mt-1 text-sm text-muted">
          Add categories from the API or seed data to build out your catalog structure.
        </p>
      </div>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="createOpen"
    title="New category"
    description="Create a top-level or nested category."
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <CategoryEditorForm
        mode="create"
        :categories="categories"
        :open="createOpen"
        :submitting="formLoading"
        @submit="handleCreate"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="editOpen"
    title="Edit category"
    :description="selectedCategory ? `Update details for ${selectedCategory.name}.` : 'Update category details.'"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <CategoryEditorForm
        mode="edit"
        :categories="categories"
        :initial-values="editInitialValues"
        :disabled-category-ids="editDisabledIds"
        :open="editOpen"
        :submitting="formLoading"
        @submit="handleUpdate"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="deleteOpen"
    :title="selectedCategory ? `Delete ${selectedCategory.name}?` : 'Delete category'"
    :description="selectedCategory ? 'Deleting this category is permanent once all dependencies are cleared.' : undefined"
  >
    <template #body>
      <p class="text-sm text-muted">
        This action cannot be undone. Ensure the category has no subcategories or products before deleting.
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
          label="Delete category"
          color="error"
          variant="solid"
          :loading="deleteLoading"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
