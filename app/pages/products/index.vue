<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const route = useRoute()

// Dynamic robots based on query params (noindex for filtered/search pages)
const hasFilters = computed(() => {
  return !!(route.query.search || route.query.brand || route.query.category || route.query.sale)
})

useSeoMeta({
  title: 'جميع المنتجات',
  description: 'تصفح جميع منتجاتنا بأسعار تنافسية وجودة عالية. اختر من مئات المنتجات المميزة. شحن سريع لجميع المحافظات ودفع عند الاستلام.',
  ogTitle: 'جميع المنتجات',
  ogDescription: 'تصفح جميع منتجاتنا بأسعار تنافسية وجودة عالية.',
  twitterCard: 'summary_large_image',
  // Index main page, noindex filtered/search results
  robots: () => hasFilters.value ? 'noindex, follow' : 'index, follow'
})

// Dynamic OG Image
defineOgImageComponent('Default', {
  headline: 'تصفح جميع المنتجات'
})

// Schema.org for Products Listing Page
useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    'name': 'جميع المنتجات',
    'description': 'تصفح جميع منتجاتنا بأسعار تنافسية وجودة عالية. اختر من مئات المنتجات المميزة.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'الرئيسية', item: '/' },
      { name: 'جميع المنتجات' }
    ]
  })
])

type BrandItem = {
  id: number
  name: string
  slug: string
  productCount?: number
}

type CategoryNode = {
  id: number
  slug: string
  name: string | Record<string, unknown>
  children?: CategoryNode[]
}

type ProductItem = {
  id: number
  name: string
  slug: string
  price: number
  salePrice?: number | null
  image: string
  brand?: { name?: string | null } | null
}

const router = useRouter()
const toast = useToast()
const { add: addToCart } = useCart()

const searchQuery = ref(typeof route.query.search === 'string' ? route.query.search : '')
const selectedBrand = ref<string | null>(typeof route.query.brand === 'string' ? route.query.brand : null)
const selectedCategory = ref<string | null>(typeof route.query.category === 'string' ? route.query.category : null)
const filterSale = ref(route.query.sale === 'true')
const priceRange = ref([0, 2000])

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' }
]
const selectedSort = ref<'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating'>(
  typeof route.query.sort === 'string' && ['featured', 'newest', 'price-asc', 'price-desc', 'rating'].includes(route.query.sort)
    ? (route.query.sort as 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating')
    : 'featured'
)

const currentPage = ref(1)
const pageSize = 20
const allProducts = ref<ProductItem[]>([])
const isLoadingMore = ref(false)
const hasMorePages = ref(true)
const loadMoreTrigger = ref<HTMLElement | null>(null)

const buildQuery = () => {
  const query: Record<string, string> = {}

  if (searchQuery.value) query.search = searchQuery.value
  if (selectedBrand.value) query.brand = selectedBrand.value
  if (selectedCategory.value) query.category = selectedCategory.value
  if (filterSale.value) query.sale = 'true'
  if (selectedSort.value && selectedSort.value !== 'featured') query.sort = selectedSort.value

  return query
}

const syncRouteQuery = () => {
  const nextQuery = buildQuery()
  const currentQuery = {
    search: typeof route.query.search === 'string' ? route.query.search : undefined,
    brand: typeof route.query.brand === 'string' ? route.query.brand : undefined,
    category: typeof route.query.category === 'string' ? route.query.category : undefined,
    sale: typeof route.query.sale === 'string' ? route.query.sale : undefined,
    sort: typeof route.query.sort === 'string' ? route.query.sort : undefined
  }

  const keys = ['search', 'brand', 'category', 'sale', 'sort'] as const
  const isSame = keys.every(key => (nextQuery[key] ?? undefined) === currentQuery[key])

  if (!isSame) {
    router.replace({ query: nextQuery })
  }
}

const queryParams = computed(() => ({
  page: currentPage.value,
  pageSize,
  search: searchQuery.value || undefined,
  sort: selectedSort.value,
  brandSlug: selectedBrand.value || undefined,
  categorySlug: selectedCategory.value || undefined,
  sale: filterSale.value ? 'true' : undefined,
  minPrice: priceRange.value[0],
  maxPrice: priceRange.value[1]
}))

const { data: productsData, pending, refresh } = await useFetch('/api/public/products', {
  query: queryParams,
  watch: false
})

const fallbackImage = 'https://placehold.co/600x750/f3f4f6/171717?text=Product'

// Map raw API data to ProductItem
const mapProduct = (raw: unknown): ProductItem => {
  const item = raw as {
    id: number
    name: string
    slug: string
    price: number
    salePrice: number | null
    image: string | null
    brand?: { name?: string | null } | null
  }
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    salePrice: item.salePrice ?? null,
    image: item.image ?? fallbackImage,
    brand: item.brand ?? null
  }
}

// Initialize products from first fetch
watch(productsData, (data) => {
  if (data && currentPage.value === 1) {
    allProducts.value = (data.items ?? []).map(mapProduct)
    hasMorePages.value = (data.pagination?.page ?? 1) < (data.pagination?.totalPages ?? 1)
  }
}, { immediate: true })

// Load more products
const loadMore = async () => {
  if (isLoadingMore.value || !hasMorePages.value) return

  isLoadingMore.value = true
  currentPage.value++

  try {
    const response = await $fetch<{ items: unknown[], pagination: { page: number, totalPages: number } }>('/api/public/products', {
      query: {
        page: currentPage.value,
        pageSize,
        search: searchQuery.value || undefined,
        sort: selectedSort.value,
        brandSlug: selectedBrand.value || undefined,
        categorySlug: selectedCategory.value || undefined,
        sale: filterSale.value ? 'true' : undefined,
        minPrice: priceRange.value[0],
        maxPrice: priceRange.value[1]
      }
    })

    const newProducts = (response.items ?? []).map(mapProduct)
    allProducts.value = [...allProducts.value, ...newProducts]
    hasMorePages.value = response.pagination.page < response.pagination.totalPages
  } catch (error) {
    console.error('Failed to load more products', error)
    currentPage.value--
  } finally {
    isLoadingMore.value = false
  }
}

// Reset and refetch when filters change
const resetAndFetch = async () => {
  currentPage.value = 1
  allProducts.value = []
  hasMorePages.value = true
  syncRouteQuery()
  await refresh()
}

watch([searchQuery, selectedBrand, selectedCategory, filterSale, selectedSort, priceRange], () => {
  resetAndFetch()
}, { deep: true })

watch(() => route.query, (next) => {
  const nextSearch = typeof next.search === 'string' ? next.search : ''
  const nextBrand = typeof next.brand === 'string' ? next.brand : null
  const nextCategory = typeof next.category === 'string' ? next.category : null
  const nextSort = typeof next.sort === 'string' && ['featured', 'newest', 'price-asc', 'price-desc', 'rating'].includes(next.sort)
    ? (next.sort as 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating')
    : 'featured'
  const nextSale = next.sale === 'true'

  if (searchQuery.value !== nextSearch) searchQuery.value = nextSearch
  if (selectedBrand.value !== nextBrand) selectedBrand.value = nextBrand
  if (selectedCategory.value !== nextCategory) selectedCategory.value = nextCategory
  if (filterSale.value !== nextSale) filterSale.value = nextSale
  if (selectedSort.value !== nextSort) selectedSort.value = nextSort
})

const { data: brandsData } = await useFetch('/api/public/brands')
const { data: categoriesData } = await useFetch('/api/public/categories')

const brands = computed<BrandItem[]>(() => (brandsData.value?.brands ?? []) as unknown as BrandItem[])

const flattenCategories = (nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> =>
  nodes.flatMap(node => [
    { ...node, depth },
    ...(node.children?.length ? flattenCategories(node.children, depth + 1) : [])
  ])

const categories = computed(() => {
  const nodes = (categoriesData.value?.categories ?? []) as CategoryNode[]
  return flattenCategories(nodes)
})

const totalProducts = computed(() => productsData.value?.pagination?.totalItems ?? allProducts.value.length)

const isFilterOpen = ref(false)

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0]
      if (target?.isIntersecting && hasMorePages.value && !isLoadingMore.value) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Re-observe when trigger element changes
watch(loadMoreTrigger, (el) => {
  if (observer && el) {
    observer.disconnect()
    observer.observe(el)
  }
})

const toggleBrand = (slug: string) => {
  selectedBrand.value = selectedBrand.value === slug ? null : slug
}

const toggleCategory = (slug: string) => {
  selectedCategory.value = selectedCategory.value === slug ? null : slug
}

const handleQuickAdd = async (product: ProductItem) => {
  try {
    await addToCart({
      title: product.name,
      price: product.salePrice ?? product.price,
      quantity: 1,
      image: product.image,
      productId: product.id
    })

    toast.add({
      title: 'تمت الإضافة إلى السلة',
      description: product.name,
      color: 'success'
    })
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'تعذر الإضافة للسلة',
      description: err?.data?.message || err?.message || 'حاول مرة أخرى',
      color: 'error'
    })
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedBrand.value = null
  selectedCategory.value = null
  filterSale.value = false
  priceRange.value = [0, 2000]
  selectedSort.value = 'featured'
}
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <main class="flex-grow pt-12 pb-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Page Title & Sort -->
        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-neutral-200 pb-6">
          <div>
            <h1 class="text-5xl lg:text-7xl font-serif font-black uppercase leading-none mb-4">
              Shop<br>All
            </h1>
            <p class="text-xs font-bold uppercase tracking-widest text-neutral-500">
              {{ totalProducts }} Products
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-end sm:items-center gap-6 w-full md:w-auto">
            <!-- Search Input -->
            <div class="relative w-full sm:w-64">
              <UIcon name="i-heroicons-magnifying-glass" class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="SEARCH PRODUCTS..."
                class="w-full bg-transparent border-b border-neutral-300 py-2 pl-6 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black placeholder-neutral-400"
              >
            </div>

            <div class="flex items-center gap-4 shrink-0">
              <span class="text-xs font-bold uppercase tracking-widest text-neutral-400">Sort By:</span>
              <select v-model="selectedSort" class="bg-transparent border-none text-sm font-bold uppercase focus:ring-0 cursor-pointer p-0 pr-8">
                <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-16">
          <!-- Sidebar Filters -->
          <aside class="w-full lg:w-64 shrink-0 transition-all duration-300" :class="isFilterOpen ? 'block' : 'hidden lg:block'">
            <div class="sticky top-32 space-y-12">
              <!-- Offers / Sale Status -->
              <div class="border-b border-neutral-200 pb-8">
                <h3 class="text-xs font-bold uppercase tracking-widest mb-6">
                  Offers
                </h3>
                <label class="flex items-center gap-3 cursor-pointer group">
                  <div class="relative flex items-center">
                    <input v-model="filterSale" type="checkbox" class="peer sr-only">
                    <div class="w-5 h-5 border border-neutral-300 bg-white peer-checked:bg-black peer-checked:border-black transition-colors" />
                    <!-- Checkmark icon -->
                    <UIcon name="i-heroicons-check" class="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span class="text-sm font-medium group-hover:text-amber-700 transition-colors">On Sale</span>
                </label>
              </div>

              <!-- Price -->
              <div>
                <h3 class="text-xs font-bold uppercase tracking-widest mb-6">
                  Price Range
                </h3>
                <div class="px-2">
                  <input
                    v-model.number="priceRange[1]"
                    type="range"
                    min="0"
                    max="2000"
                    class="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  >
                  <div class="flex justify-between mt-4 text-xs font-medium">
                    <span>${{ priceRange[0] }}</span>
                    <span>${{ priceRange[1] }}+</span>
                  </div>
                </div>
              </div>

              <!-- Brands -->
              <div>
                <h3 class="text-xs font-bold uppercase tracking-widest mb-6">
                  Brands
                </h3>
                <div class="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                  <label v-for="brand in brands" :key="brand.slug" class="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-black focus:ring-black"
                      :checked="selectedBrand === brand.slug"
                      @change="toggleBrand(brand.slug)"
                    >
                    <span class="text-sm text-neutral-600 group-hover:text-black transition-colors">
                      {{ brand.name }}
                    </span>
                  </label>
                </div>
              </div>

              <!-- Categories -->
              <div>
                <h3 class="text-xs font-bold uppercase tracking-widest mb-6">
                  Categories
                </h3>
                <div class="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                  <label v-for="category in categories" :key="category.slug" class="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-black focus:ring-black"
                      :checked="selectedCategory === category.slug"
                      @change="toggleCategory(category.slug)"
                    >
                    <span
                      class="text-sm text-neutral-600 group-hover:text-black transition-colors"
                      :style="{ paddingLeft: `${category.depth * 8}px` }"
                    >
                      {{ typeof category.name === 'string' ? category.name : category.slug }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <!-- Product Grid -->
          <div class="flex-grow">
            <!-- Initial Loading -->
            <div v-if="pending && allProducts.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              <div v-for="i in 6" :key="i" class="animate-pulse">
                <div class="aspect-[4/5] bg-neutral-200 mb-4 rounded" />
                <div class="h-3 bg-neutral-200 rounded w-1/3 mb-2" />
                <div class="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
                <div class="h-4 bg-neutral-200 rounded w-1/4" />
              </div>
            </div>

            <!-- Products Grid -->
            <div v-else-if="allProducts.length > 0">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                <NuxtLink
                  v-for="product in allProducts"
                  :key="product.id"
                  :to="`/products/${product.slug}`"
                  class="group cursor-pointer block"
                >
                  <div class="relative aspect-[4/5] bg-neutral-100 mb-4 overflow-hidden">
                    <img
                      :src="product.image"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      :alt="product.name"
                    >

                    <div v-if="product.salePrice" class="absolute top-4 left-4">
                      <span class="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest">Sale</span>
                    </div>

                    <button
                      type="button"
                      class="absolute bottom-0 right-0 w-12 h-12 bg-white/90 hover:bg-black hover:text-white flex items-center justify-center transition-colors duration-300 z-10 translate-y-full group-hover:translate-y-0"
                      aria-label="Quick Add"
                      @click.stop.prevent="handleQuickAdd(product)"
                    >
                      <UIcon name="i-heroicons-plus" class="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <p class="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-1">
                      {{ product.brand?.name || 'Brand' }}
                    </p>
                    <h3 class="text-sm font-bold uppercase tracking-wide mb-1 group-hover:text-amber-700 transition">
                      {{ product.name }}
                    </h3>
                    <div class="flex items-center gap-2">
                      <p class="font-serif font-medium">
                        ${{ (product.salePrice ?? product.price).toFixed(2) }}
                      </p>
                      <p v-if="product.salePrice" class="text-xs text-neutral-400 line-through">
                        ${{ product.price.toFixed(2) }}
                      </p>
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <!-- Loading More Indicator -->
              <div
                v-if="isLoadingMore"
                class="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
              >
                <div v-for="i in 3" :key="`loading-${i}`" class="animate-pulse">
                  <div class="aspect-[4/5] bg-neutral-200/60 mb-4 rounded backdrop-blur-sm" />
                  <div class="h-3 bg-neutral-200/60 rounded w-1/3 mb-2" />
                  <div class="h-4 bg-neutral-200/60 rounded w-2/3 mb-2" />
                  <div class="h-4 bg-neutral-200/60 rounded w-1/4" />
                </div>
              </div>

              <!-- Infinite Scroll Trigger -->
              <div
                ref="loadMoreTrigger"
                class="h-20 flex items-center justify-center mt-8"
              >
                <div v-if="hasMorePages && !isLoadingMore" class="text-neutral-400 text-sm">
                  Scroll for more
                </div>
                <div v-else-if="!hasMorePages" class="text-neutral-400 text-sm">
                  You've seen all {{ totalProducts }} products
                </div>
              </div>
            </div>

            <!-- No Products -->
            <div v-else class="py-24 text-center">
              <p class="text-xl font-serif text-neutral-400">
                No products found matching your filters.
              </p>
              <button
                class="mt-4 text-xs font-bold uppercase tracking-widest border-b border-black pb-1"
                @click="clearFilters"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
