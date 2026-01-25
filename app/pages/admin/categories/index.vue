<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import CategoryEditorForm from '~/components/categories/CategoryEditorForm.vue'
import type { CategoryEditorValues, CategoryListResponse } from '~/types'
import type { FlattenedCategory } from '~/utils/categories'
import { flattenCategoryTree } from '~/utils/categories'

const NuxtLink = resolveComponent('NuxtLink')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const { data, status, error, refresh } = await useFetch<CategoryListResponse>('/api/categories')

const createOpen = ref(false)
const editOpen = ref(false)
const viewOpen = ref(false)
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

  const category = selectedCategory.value
  const enTranslation = category.translationsRaw?.find(t => t.lang === 'EN')
  const arTranslation = category.translationsRaw?.find(t => t.lang === 'AR')

  return {
    nameEn: enTranslation?.name ?? category.translations.en ?? category.name,
    nameAr: arTranslation?.name ?? category.translations.ar ?? '',
    descriptionEn: enTranslation?.description ?? undefined,
    descriptionAr: arTranslation?.description ?? undefined,
    parentId: category.parentId,
    // Image - use ogImage from EN translation as the category image
    image: enTranslation?.ogImage ?? undefined,
    // SEO fields
    seoTitleEn: enTranslation?.metaTitle ?? undefined,
    seoTitleAr: arTranslation?.metaTitle ?? undefined,
    seoDescriptionEn: enTranslation?.metaDescription ?? undefined,
    seoDescriptionAr: arTranslation?.metaDescription ?? undefined,
    seoKeywordsEn: enTranslation?.metaKeywords ?? undefined,
    seoKeywordsAr: arTranslation?.metaKeywords ?? undefined,
    ogTitleEn: enTranslation?.ogTitle ?? undefined,
    ogTitleAr: arTranslation?.ogTitle ?? undefined,
    ogDescriptionEn: enTranslation?.ogDescription ?? undefined,
    ogDescriptionAr: arTranslation?.ogDescription ?? undefined
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
    cell: ({ row }) => {
      const count = row.original.productCount
      if (count === 0) {
        return h('span', { class: 'text-sm text-muted' }, '0')
      }
      return h(
        NuxtLink,
        {
          to: { path: '/admin/products', query: { categoryId: row.original.id } },
          class: 'text-sm text-primary-500 hover:text-primary-600 hover:underline font-medium'
        },
        () => count.toString()
      )
    }
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
      label: 'View',
      icon: 'i-lucide-eye',
      onSelect: () => openView(category)
    },
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

function openView(category: FlattenedCategory) {
  selectedCategory.value = category
  viewOpen.value = true
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

watch(viewOpen, (open) => {
  if (!open) {
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

  <!-- View Category Modal -->
  <UModal
    v-model:open="viewOpen"
    :title="selectedCategory?.name ?? 'Category Details'"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div v-if="selectedCategory" class="space-y-6">
        <!-- Category Header -->
        <div class="flex items-start gap-4">
          <UAvatar
            v-if="editInitialValues.image"
            :src="editInitialValues.image"
            size="3xl"
            :ui="{ image: 'object-contain' }"
          />
          <div v-else class="p-3 rounded-lg bg-primary/10">
            <UIcon name="i-lucide-folder" class="w-8 h-8 text-primary" />
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-highlighted">
              {{ selectedCategory.name }}
            </h3>
            <p class="text-sm text-muted">
              Slug: <code class="font-mono bg-muted/20 px-1 rounded">{{ selectedCategory.slug }}</code>
            </p>
            <div class="flex gap-4 mt-2">
              <UBadge variant="subtle" color="primary">
                {{ selectedCategory.productCount }} {{ selectedCategory.productCount === 1 ? 'product' : 'products' }}
              </UBadge>
              <UBadge variant="subtle" color="neutral">
                {{ selectedCategory.childCount }} {{ selectedCategory.childCount === 1 ? 'subcategory' : 'subcategories' }}
              </UBadge>
            </div>
          </div>
        </div>

        <UDivider />

        <!-- Parent Category -->
        <div v-if="selectedCategory.parentId">
          <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Parent Category
          </p>
          <p class="text-sm text-highlighted">
            {{ flattenedCategories.find(c => c.id === selectedCategory?.parentId)?.name || `ID: ${selectedCategory.parentId}` }}
          </p>
        </div>

        <!-- Translations -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              Name (English)
            </p>
            <p class="text-sm text-highlighted">
              {{ editInitialValues.nameEn || '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              Name (Arabic)
            </p>
            <p class="text-sm text-highlighted" dir="rtl">
              {{ editInitialValues.nameAr || '-' }}
            </p>
          </div>
        </div>

        <!-- Descriptions -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              Description (English)
            </p>
            <p class="text-sm text-highlighted whitespace-pre-wrap">
              {{ editInitialValues.descriptionEn || '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              Description (Arabic)
            </p>
            <p class="text-sm text-highlighted whitespace-pre-wrap" dir="rtl">
              {{ editInitialValues.descriptionAr || '-' }}
            </p>
          </div>
        </div>

        <!-- SEO Section -->
        <div v-if="editInitialValues.seoTitleEn || editInitialValues.seoDescriptionEn" class="space-y-4">
          <UDivider label="SEO" />

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                SEO Title (EN)
              </p>
              <p class="text-sm text-highlighted">
                {{ editInitialValues.seoTitleEn || '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                SEO Title (AR)
              </p>
              <p class="text-sm text-highlighted" dir="rtl">
                {{ editInitialValues.seoTitleAr || '-' }}
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                SEO Description (EN)
              </p>
              <p class="text-sm text-highlighted">
                {{ editInitialValues.seoDescriptionEn || '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                SEO Description (AR)
              </p>
              <p class="text-sm text-highlighted" dir="rtl">
                {{ editInitialValues.seoDescriptionAr || '-' }}
              </p>
            </div>
          </div>

          <div v-if="editInitialValues.seoKeywordsEn || editInitialValues.seoKeywordsAr" class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                Keywords (EN)
              </p>
              <p class="text-sm text-highlighted">
                {{ editInitialValues.seoKeywordsEn || '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                Keywords (AR)
              </p>
              <p class="text-sm text-highlighted" dir="rtl">
                {{ editInitialValues.seoKeywordsAr || '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Category Path -->
        <div v-if="selectedCategory.path" class="pt-4 border-t border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Category Path
          </p>
          <p class="text-sm text-highlighted font-mono">
            {{ selectedCategory.path }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <UButton
            label="Close"
            color="neutral"
            variant="subtle"
            @click="viewOpen = false"
          />
          <UButton
            label="Edit"
            icon="i-lucide-pencil"
            @click="viewOpen = false; openEdit(selectedCategory)"
          />
        </div>
      </div>
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
