<script setup lang="ts">
import type { ProductDetailResponse, ProductInventoryStatus } from '~/types'

const route = useRoute()

const productId = Number(route.params.id)

if (!Number.isFinite(productId) || productId <= 0) {
  await navigateTo('/products')
}

const {
  data,
  status,
  error,
  refresh
} = await useFetch<ProductDetailResponse>(`/api/products/${productId}`)

const product = computed(() => data.value?.product)

const statusColorMap: Record<ProductInventoryStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
  archived: 'neutral'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2
  }).format(value)
}

function handleRefresh() {
  return refresh()
}

const isArchived = computed(() => Boolean(product.value?.isArchived))
</script>

<template>
  <UDashboardPanel :id="`product-${productId}`">
    <template #header>
      <UDashboardNavbar title="Product details">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              label="Refresh"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              @click="handleRefresh"
            />
            <UButton
              label="Edit"
              icon="i-lucide-pencil"
              @click="navigateTo({ path: `/products/${productId}/edit` })"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Unable to load product"
          :description="error.message"
        />

        <USkeleton v-if="status === 'pending'" class="h-64 rounded-xl" />

        <UCard v-else-if="product">
          <template #header>
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-sm text-muted">
                  Product name
                </p>
                <h2 class="text-lg font-semibold">
                  {{ product.name }}
                </h2>
                <p class="text-sm text-muted">
                  Slug: {{ product.slug }}
                </p>
              </div>

              <UBadge
                :color="statusColorMap[product.status]"
                variant="subtle"
                class="self-start capitalize"
              >
                {{ product.status.replace(/_/g, ' ') }}
              </UBadge>
            </div>
          </template>

          <UAlert
            v-if="isArchived"
            variant="soft"
            color="warning"
            title="Archived product"
            description="This product is archived. It will not appear in storefront listings until restored."
            class="mb-4"
          />

          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted">
                Pricing
              </h3>
              <p class="text-lg font-semibold text-highlighted">
                {{ formatCurrency(product.price) }}
              </p>
              <p v-if="product.salePrice" class="text-sm text-success">
                Sale price: {{ formatCurrency(product.salePrice) }}
              </p>
              <p v-if="product.discountPercentage" class="text-sm text-muted">
                Discount: {{ product.discountPercentage }}%
              </p>
            </div>

            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted">
                Inventory
              </h3>
              <p class="text-lg font-semibold text-highlighted">
                {{ product.quantity }} in stock
              </p>
              <p v-if="product.stock !== null" class="text-sm text-muted">
                Reserved stock: {{ product.stock }}
              </p>
            </div>

            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted">
                Category & Brand
              </h3>
              <p class="text-sm">
                Category: {{ product.category?.name ?? 'Uncategorized' }}
              </p>
              <p class="text-sm">
                Brand: {{ product.brand?.name ?? 'No brand' }}
              </p>
            </div>

            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted">
                Metadata
              </h3>
              <p class="text-sm text-muted">
                Updated {{ new Date(product.updatedAt).toLocaleString() }}
              </p>
            </div>
          </div>
        </UCard>

        <UAlert
          v-else
          color="warning"
          variant="soft"
          title="Product not found"
          description="The product may have been deleted."
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
