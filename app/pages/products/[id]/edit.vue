<script setup lang="ts">
import BrandQuickCreateModal from '~/components/brands/BrandQuickCreateModal.vue'
import ProductEditorForm from '~/components/products/ProductEditorForm.vue'
import type { BrandEditorValues, ProductDetailResponse, ProductEditorValues, ProductFiltersResponse } from '~/types'
import { mapProductDetailToEditorValues } from '~/utils/product-editor'

const route = useRoute()
const toast = useToast()

const saving = ref(false)
const quickBrandOpen = ref(false)
const quickBrandLoading = ref(false)
const productFormRef = ref<{ setCategoryId: (id: number | null) => void, setBrandId: (id: number | null) => void } | null>(null)

const productId = Number(route.params.id)

if (!Number.isFinite(productId) || productId <= 0) {
  await navigateTo('/products')
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
            @open-brand-create="quickBrandOpen = true"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <BrandQuickCreateModal
    v-model:open="quickBrandOpen"
    :submitting="quickBrandLoading"
    @submit="handleQuickBrandSubmit"
  />
</template>
