<script setup lang="ts">
import BrandQuickCreateModal from '~/components/brands/BrandQuickCreateModal.vue'
import CategoryQuickCreateModal from '~/components/categories/CategoryQuickCreateModal.vue'
import ProductEditorForm from '~/components/products/ProductEditorForm.vue'
import type { BrandEditorValues, ProductBasePayload, ProductDetailResponse, ProductEditorValues, ProductFiltersResponse } from '~/types'
import { mapProductDetailToEditorValues } from '~/utils/product-editor'

const route = useRoute()
const toast = useToast()

const saving = ref(false)
const quickBrandOpen = ref(false)
const quickBrandLoading = ref(false)
const quickCategoryOpen = ref(false)
const quickCategoryLoading = ref(false)
const productFormRef = ref<{ setCategoryId: (id: number | null) => void, setBrandId: (id: number | null) => void } | null>(null)

const productId = Number(route.params.id)

if (!Number.isFinite(productId) || productId <= 0) {
  await navigateTo('/admin/products')
}

const {
  data: productData,
  status: productStatus,
  error: productError,
  refresh: refreshProduct
} = await useFetch<ProductDetailResponse>(`/api/products/${productId}`)

const {
  data: filtersData,
  status: filtersStatus,
  error: filtersError,
  refresh: refreshFilters
} = await useFetch<ProductFiltersResponse>('/api/products/filters')

const categories = computed(() => filtersData.value?.categories ?? [])
const brands = computed(() => filtersData.value?.brands ?? [])

const initialValues = computed<Partial<ProductEditorValues>>(() => {
  const product = productData.value?.product

  if (!product) {
    return {}
  }

  return mapProductDetailToEditorValues(product)
})

const isLoading = computed(() => productStatus.value === 'pending' || filtersStatus.value === 'pending')

async function handleSubmit(payload: ProductBasePayload) {
  saving.value = true

  try {
    const response = await $fetch<ProductDetailResponse>(`/api/products/${productId}`, {
      method: 'PATCH',
      body: payload
    })

    toast.add({
      title: 'Product updated',
      description: `${response.product.name} is up to date.`
    })

    await refreshProduct()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update product'
    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error'
    })
  } finally {
    saving.value = false
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
</script>

<template>
  <UDashboardPanel :id="`product-edit-${productId}`">
    <template #header>
      <UDashboardNavbar title="Edit product">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <UTooltip text="Go back to product details">
          <UButton
            icon="fa7-solid:long-arrow-alt-left"
            color="neutral"
            variant="ghost"
            size="xl"
            :to="`/admin/products/${productId}`"
            class="h-7 px-4 -mt-4 text-4xl"
          />
        </UTooltip>
        <UAlert
          v-if="productError"
          color="error"
          variant="soft"
          title="Unable to load product"
          :description="productError.message"
        />

        <UAlert
          v-if="filtersError"
          color="error"
          variant="soft"
          title="Unable to load categories and brands"
          :description="filtersError.message"
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
            mode="edit"
            :initial-values="initialValues"
            :categories="categories"
            :brands="brands"
            :loading="saving || productStatus === 'pending'"
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
