<script setup lang="ts">
import type { ProductDetailResponse, ProductInventoryStatus } from '~/types'

const route = useRoute()

const productId = Number(route.params.id)

if (!Number.isFinite(productId) || productId <= 0) {
  await navigateTo('/admin/products')
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleRefresh() {
  return refresh()
}

const isArchived = computed(() => Boolean(product.value?.isArchived))

// Get all images
const productImages = computed(() => product.value?.images ?? [])

// Calculate savings
const savings = computed(() => {
  if (!product.value?.salePrice || !product.value?.price) return null
  const saved = product.value.price - product.value.salePrice
  return saved > 0 ? saved : null
})
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
              @click="navigateTo({ path: `/admin/products/${productId}/edit` })"
            />
          </div>
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
            :to="`/admin/products/`"
            class="h-7 px-4 -mt-4 text-4xl"
          />
        </UTooltip>
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
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="flex-1">
                <p class="text-xs text-muted uppercase tracking-wide mb-1">
                  Product #{{ product.id }}
                </p>
                <h2 class="text-2xl font-bold text-highlighted">
                  {{ product.name }}
                </h2>
                <p class="text-sm text-muted mt-1">
                  <span class="font-mono bg-muted/10 px-2 py-0.5 rounded">{{ product.slug }}</span>
                </p>
              </div>

              <div class="flex items-center gap-2">
                <UBadge
                  :color="statusColorMap[product.status]"
                  variant="subtle"
                  class="capitalize"
                >
                  {{ product.status.replace(/_/g, ' ') }}
                </UBadge>
                <UBadge v-if="product.salePrice" color="success" variant="soft">
                  On Sale
                </UBadge>
              </div>
            </div>
          </template>

          <UAlert
            v-if="isArchived"
            variant="soft"
            color="warning"
            title="Archived product"
            description="This product is archived. It will not appear in storefront listings until restored."
            class="mb-6"
          />

          <!-- Images Gallery -->
          <div v-if="productImages.length" class="mb-8">
            <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              Product Images
            </h3>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="(img, idx) in productImages"
                :key="idx"
                class="relative w-24 h-24 rounded-lg overflow-hidden border border-default bg-muted/5"
              >
                <img
                  :src="img"
                  :alt="`Product image ${idx + 1}`"
                  class="w-full h-full object-cover"
                >
                <span
                  v-if="idx === 0"
                  class="absolute top-1 left-1 text-[10px] bg-black text-white px-1.5 py-0.5 rounded"
                >
                  Main
                </span>
              </div>
            </div>
          </div>

          <div class="grid gap-8 lg:grid-cols-2">
            <!-- Left Column -->
            <div class="space-y-6">
              <!-- Pricing Section -->
              <div class="bg-muted/5 rounded-lg p-4 border border-default">
                <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                  Pricing
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted">Regular Price</span>
                    <span class="text-lg font-bold" :class="product.salePrice ? 'text-muted line-through' : 'text-highlighted'">
                      {{ formatCurrency(product.price) }}
                    </span>
                  </div>
                  <div v-if="product.salePrice" class="flex items-center justify-between">
                    <span class="text-sm text-muted">Sale Price</span>
                    <span class="text-xl font-bold text-success">
                      {{ formatCurrency(product.salePrice) }}
                    </span>
                  </div>
                  <div v-if="savings" class="flex items-center justify-between text-success">
                    <span class="text-sm">Customer Saves</span>
                    <span class="font-semibold">{{ formatCurrency(savings) }}</span>
                  </div>
                  <div v-if="product.discountPercentage" class="flex items-center justify-between">
                    <span class="text-sm text-muted">Discount</span>
                    <UBadge color="success" variant="soft">
                      {{ product.discountPercentage }}% OFF
                    </UBadge>
                  </div>
                </div>
              </div>

              <!-- Inventory Section -->
              <div class="bg-muted/5 rounded-lg p-4 border border-default">
                <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                  Inventory
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted">Available Quantity</span>
                    <span class="text-lg font-bold text-highlighted">{{ product.quantity }}</span>
                  </div>
                  <div v-if="product.stock !== null" class="flex items-center justify-between">
                    <span class="text-sm text-muted">Reserved Stock</span>
                    <span class="font-medium">{{ product.stock }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted">Status</span>
                    <UBadge :color="statusColorMap[product.status]" variant="subtle" class="capitalize">
                      {{ product.status.replace(/_/g, ' ') }}
                    </UBadge>
                  </div>
                </div>
              </div>

              <!-- Category & Brand -->
              <div class="bg-muted/5 rounded-lg p-4 border border-default">
                <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                  Classification
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted">Category</span>
                    <span v-if="product.category" class="font-medium">
                      {{ product.category.name }}
                      <span class="text-xs text-muted">({{ product.category.slug }})</span>
                    </span>
                    <span v-else class="text-muted italic">Uncategorized</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted">Brand</span>
                    <span v-if="product.brand" class="font-medium">
                      {{ product.brand.name }}
                      <span class="text-xs text-muted">({{ product.brand.slug }})</span>
                    </span>
                    <span v-else class="text-muted italic">No brand</span>
                  </div>
                  <div v-if="product.rating" class="flex items-center justify-between">
                    <span class="text-sm text-muted">Rating</span>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-star" class="w-4 h-4 text-yellow-500" />
                      <span class="font-medium">{{ product.rating.toFixed(1) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
              <!-- Description -->
              <div v-if="product.description || product.shortDescription" class="bg-muted/5 rounded-lg p-4 border border-default">
                <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                  Description
                </h3>
                <div class="space-y-4">
                  <div v-if="product.shortDescription">
                    <p class="text-xs text-muted uppercase mb-1">
                      Short Description
                    </p>
                    <p class="text-sm">
                      {{ product.shortDescription }}
                    </p>
                  </div>
                  <div v-if="product.description">
                    <p class="text-xs text-muted uppercase mb-1">
                      Full Description
                    </p>
                    <p class="text-sm whitespace-pre-wrap">
                      {{ product.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Translations Info -->
              <div v-if="product.raw?.translations?.length" class="bg-muted/5 rounded-lg p-4 border border-default">
                <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                  Translations ({{ product.raw.translations.length }})
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="trans in product.raw.translations"
                    :key="trans.lang"
                    class="flex items-start gap-3 p-2 bg-background rounded"
                  >
                    <UBadge color="neutral" variant="soft" class="uppercase">
                      {{ trans.lang }}
                    </UBadge>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium truncate">
                        {{ trans.name }}
                      </p>
                      <p v-if="trans.shortDescription" class="text-xs text-muted truncate">
                        {{ trans.shortDescription }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Metadata -->
              <div class="bg-muted/5 rounded-lg p-4 border border-default">
                <h3 class="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
                  Metadata
                </h3>
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted">Product ID</span>
                    <span class="font-mono">{{ product.id }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-muted">Last Updated</span>
                    <span>{{ formatDate(product.updatedAt) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-muted">Archived</span>
                    <UBadge :color="product.isArchived ? 'warning' : 'success'" variant="soft">
                      {{ product.isArchived ? 'Yes' : 'No' }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="mt-8 pt-6 border-t border-default flex flex-wrap gap-3">
            <UButton
              label="Edit Product"
              icon="i-lucide-pencil"
              @click="navigateTo(`/admin/products/${productId}/edit`)"
            />
            <UButton
              label="View on Store"
              icon="i-lucide-external-link"
              color="neutral"
              variant="outline"
              @click="navigateTo(`/products/${product.slug}`, { open: { target: '_blank' } })"
            />
            <UButton
              label="Duplicate"
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              disabled
            />
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
