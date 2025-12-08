<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const search = ref('')
const selectedCategories = ref<number[]>([])
const sortBy = ref<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured')
const priceMin = ref(0)
const priceMax = ref(10000)
const currentPage = ref(1)

const { data: categoriesData } = await useFetch('/api/public/categories')

const availableCategories = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (categoriesData.value?.categories || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug
  }))
)

const queryParams = computed(() => ({
  page: currentPage.value,
  pageSize: 12,
  search: search.value || undefined,
  categoryId: selectedCategories.value.length ? selectedCategories.value[0] : undefined,
  minPrice: priceMin.value > 0 ? priceMin.value : undefined,
  maxPrice: priceMax.value < 10000 ? priceMax.value : undefined,
  sort: sortBy.value
}))

const { data: productsData, refresh } = await useFetch('/api/public/products', {
  query: queryParams
})

watch([search, selectedCategories, priceMin, priceMax, sortBy], () => {
  currentPage.value = 1
  refresh()
})

watch(currentPage, () => {
  refresh()
})

const products = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (productsData.value?.items || []).map((item: any) => ({
    title: item.name,
    price: item.price,
    salePrice: item.salePrice,
    image: item.images?.[0]?.url,
    rating: 4.8,
    to: `/products/${item.slug}`,
    productId: item.id
  }))
)

const totalProducts = computed(() => productsData.value?.pagination?.totalItems || 0)

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' }
]

const resetFilters = () => {
  search.value = ''
  selectedCategories.value = []
  priceMin.value = 0
  priceMax.value = 10000
  sortBy.value = 'featured'
}
</script>

<template>
  <UContainer class="py-12 space-y-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">
        Products
      </h1>
      <p class="text-muted">
        Browse our catalog, search, and filter by category or price.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      <UCard class="self-start space-y-6">
        <div class="flex items-center justify-between">
          <p class="font-semibold">
            Filters
          </p>
          <UButton
            variant="ghost"
            size="xs"
            icon="i-lucide-rotate-ccw"
            @click="resetFilters"
          >
            Reset
          </UButton>
        </div>

        <UFormGroup label="Search">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Search products" />
        </UFormGroup>

        <UFormGroup label="Categories">
          <div class="space-y-2">
            <UCheckbox
              v-for="cat in availableCategories"
              :key="cat.id"
              v-model="selectedCategories"
              :value="cat.id"
              :label="cat.name"
            />
          </div>
        </UFormGroup>

        <UFormGroup label="Price range (EGP)">
          <div class="flex items-center gap-2">
            <UInput
              v-model.number="priceMin"
              type="number"
              min="0"
              max="10000"
              size="xs"
            />
            <span class="text-muted text-sm">to</span>
            <UInput
              v-model.number="priceMax"
              type="number"
              min="0"
              max="10000"
              size="xs"
            />
          </div>
        </UFormGroup>
      </UCard>

      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p class="text-sm text-muted">
            Showing {{ totalProducts }} products
          </p>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">Sort</span>
            <USelectMenu v-model="sortBy" :options="sortOptions" size="sm" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProductCard v-for="product in products" :key="product.productId" v-bind="product" />
        </div>
      </div>
    </div>
  </UContainer>
</template>
