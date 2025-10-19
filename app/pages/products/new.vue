<script setup lang="ts">
import { ref } from 'vue'

import CategoryQuickCreateModal from '~/components/categories/CategoryQuickCreateModal.vue'
import BrandQuickCreateModal from '~/components/brands/BrandQuickCreateModal.vue'
import ProductEditorForm from '~/components/products/ProductEditorForm.vue'
import type { BrandEditorValues, ProductDetailResponse, ProductEditorValues, ProductFiltersResponse } from '~/types'
import { mapProductDetailToEditorValues } from '~/utils/product-editor'

const route = useRoute()
const toast = useToast()

const saving = ref(false)
const quickCategoryOpen = ref(false)
const quickCategoryLoading = ref(false)
const quickBrandOpen = ref(false)
const quickBrandLoading = ref(false)
const productFormRef = ref<{ setCategoryId: (id: number | null) => void, setBrandId: (id: number | null) => void } | null>(null)

const {
  data: filtersData,
  status: filtersStatus,
  error: filtersError,
  refresh: refreshFilters
} = await useFetch<ProductFiltersResponse>('/api/products/filters')

const duplicateFromParam = computed(() => {
  const queryValue = Array.isArray(route.query.duplicateFrom)
    ? route.query.duplicateFrom[0]
    : route.query.duplicateFrom

  if (!queryValue) {
    return null
  }

  const numeric = Number(queryValue)

  return Number.isFinite(numeric) ? numeric : null
})

const duplicateProduct = duplicateFromParam.value
  ? await useFetch<ProductDetailResponse>(`/api/products/${duplicateFromParam.value}`)
  : null

const duplicateError = computed(() => duplicateProduct?.error.value)
const duplicateLoading = computed(() => Boolean(duplicateProduct?.status.value === 'pending'))

const categories = computed(() => filtersData.value?.categories ?? [])
const brands = computed(() => filtersData.value?.brands ?? [])

const initialValues = computed<Partial<ProductEditorValues>>(() => {
  const product = duplicateProduct?.data.value?.product

  if (!product) {
    return {}
  }

  const baseValues = mapProductDetailToEditorValues(product)

  return {
    ...baseValues,
    slug: '',
    isArchived: false
  }
})

const isLoading = computed(() => filtersStatus.value === 'pending' || duplicateLoading.value)

async function handleSubmit(values: ProductEditorValues) {
  saving.value = true

  try {
    const payload = {
      nameEn: values.nameEn,
      nameAr: values.nameAr,
      price: values.price,
      salePrice: values.salePrice ?? null,
      quantity: values.quantity,
      categoryId: values.categoryId ?? null,
      brandId: values.brandId ?? null
    }

    const response = await $fetch<ProductDetailResponse>('/api/products', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Product created',
      description: `${response.product.name} is ready.`
    })

    await navigateTo({ path: `/products/${response.product.id}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create product'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function handleQuickCategorySubmit(payload: { nameEn: string, parentId: number | null }) {
  quickCategoryLoading.value = true

  try {
    const response = await $fetch<{ category: { id: number, name: string } }>('/api/categories', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Category created',
      description: `${response.category.name} is ready.`
    })

    quickCategoryOpen.value = false
    await refreshFilters()
    productFormRef.value?.setCategoryId(response.category.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create category'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    quickCategoryLoading.value = false
  }
}

async function handleQuickBrandSubmit(values: BrandEditorValues) {
  quickBrandLoading.value = true

  try {
    const response = await $fetch<{ brand: { id: number, name: string } }>('/api/brands', {
      method: 'POST',
      body: {
        nameEn: values.nameEn,
        nameAr: values.nameAr ?? undefined,
        logo: values.logo ?? null
      }
    })

    toast.add({
      title: 'Brand created',
      description: `${response.brand.name} is ready.`
    })

    quickBrandOpen.value = false
    await refreshFilters()
    productFormRef.value?.setBrandId(response.brand.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create brand'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    quickBrandLoading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="product-new">
    <template #header>
      <UDashboardNavbar title="New product">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="filtersError"
          color="error"
          variant="soft"
          title="Unable to load categories and brands"
          :description="filtersError.message"
        />

        <UAlert
          v-if="duplicateFromParam && duplicateError"
          color="error"
          variant="soft"
          title="Unable to duplicate product"
          :description="duplicateError.message"
        />

        <UAlert
          v-else-if="duplicateFromParam"
          color="primary"
          variant="subtle"
          title="You're duplicating an existing product"
          :description="`We pre-filled the form with details from product #${duplicateFromParam}.`"
        />

        <USkeleton v-if="isLoading" class="h-64 rounded-xl" />

        <UCard v-else>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">
                  Basic information
                </p>
                <h2 class="text-lg font-semibold">
                  Product details
                </h2>
              </div>
            </div>
          </template>

          <ProductEditorForm
            ref="productFormRef"
            mode="create"
            :initial-values="initialValues"
            :categories="categories"
            :brands="brands"
            :loading="saving"
            @submit="handleSubmit"
            @open-category-create="quickCategoryOpen = true"
            @open-brand-create="quickBrandOpen = true"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <CategoryQuickCreateModal
    v-model:open="quickCategoryOpen"
    :categories="categories"
    :submitting="quickCategoryLoading"
    @submit="handleQuickCategorySubmit"
  />

  <BrandQuickCreateModal
    v-model:open="quickBrandOpen"
    :submitting="quickBrandLoading"
    @submit="handleQuickBrandSubmit"
  />
</template>
