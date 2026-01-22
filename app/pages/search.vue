<script setup lang="ts">
import { computed, ref, watch } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const route = useRoute()

// Dynamic SEO based on search query
const searchMeta = computed(() => {
  const q = (route.query.q as string) || ''
  return {
    title: q ? `Search Results: ${q}` : 'Search',
    description: q ? `Showing search results for "${q}" in the store` : 'Search for your favorite products'
  }
})

useSeoMeta({
  title: () => searchMeta.value.title,
  description: () => searchMeta.value.description,
  robots: 'noindex, follow'
})
const search = ref<string>((route.query.q as string) || '')
const sort = ref<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured')
const page = ref(1)

const queryParams = computed(() => ({
  page: page.value,
  pageSize: 12,
  search: search.value || undefined,
  sort: sort.value
}))

const { data, pending, refresh, error } = await useFetch('/api/public/products', {
  query: queryParams
})

watch([search, sort], () => {
  page.value = 1
  refresh()
})

const products = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data.value?.items || []).map((item: any) => ({
    title: item.name,
    price: item.price,
    salePrice: item.salePrice,
    image: item.image,
    rating: item.rating ?? 4.8,
    to: `/products/${item.slug}`,
    productId: item.id
  }))
)

const total = computed(() => data.value?.pagination?.totalItems || 0)

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' }
]
</script>

<template>
  <UContainer class="py-12 space-y-8">
    <div class="space-y-2">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Search for products
      </p>
      <h1 class="text-3xl font-semibold">
        Search Results
      </h1>
      <p class="text-gray-600 dark:text-gray-300">
        Type a product name or category to find what you're looking for.
      </p>
    </div>

    <UCard class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3 items-center">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search for a product..."
          size="lg"
        />
        <div class="flex items-center gap-2 justify-end">
          <span class="text-sm text-gray-500 dark:text-gray-400">Sort</span>
          <USelectMenu v-model="sort" :options="sortOptions" />
        </div>
      </div>
    </UCard>

    <div v-if="error" class="text-red-500 text-sm">
      {{ error?.message || 'Failed to load results' }}
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Results: {{ total }}</span>
        <span v-if="pending">Loading...</span>
      </div>

      <div v-if="!pending && !products.length" class="text-gray-500 dark:text-gray-300">
        No matching results found.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProductCard
          v-for="product in products"
          :key="product.productId"
          v-bind="product"
        />
      </div>
    </div>
  </UContainer>
</template>
