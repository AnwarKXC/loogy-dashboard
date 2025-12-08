// @ts-nocheck
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const route = useRoute()
const slug = route.params.slug as string

const { data: categoryData } = await useFetch(`/api/public/categories/${slug}`)

const { data: productsData, pending } = await useFetch('/api/public/products', {
  query: { categorySlug: slug, pageSize: 12 }
})

const products = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (productsData.value?.items || []).map((item: any) => ({
    title: item.name,
    price: item.price,
    salePrice: item.salePrice,
    image: item.images?.[0]?.url,
    to: `/products/${item.slug}`,
    productId: item.id
  }))
)

const categoryName = computed(() => categoryData.value?.name || slug)
const productCount = computed(() => productsData.value?.pagination?.totalItems || 0)
</script>

<template>
  <UContainer class="py-12 space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold capitalize">
          {{ categoryName }}
        </h1>
        <p class="text-muted">
          Browse products inside this category.
        </p>
      </div>
      <UButton icon="i-lucide-filter">
        Filters
      </UButton>
    </div>

    <div v-if="pending" class="text-muted">
      Loading products...
    </div>
    <div v-else-if="productCount === 0" class="text-muted">
      No products found in this category yet.
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProductCard v-for="product in products" :key="product.productId" v-bind="product" />
    </div>
  </UContainer>
</template>
