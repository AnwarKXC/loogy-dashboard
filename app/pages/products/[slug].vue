<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { add: addToCart } = useCart()
const { items: wishlistItems, add: addToWishlist, remove: removeFromWishlist } = useWishlist()

type ProductDetail = {
  id: number
  name: string
  price: number
  salePrice?: number | null
  description?: string | null
  shortDescription?: string | null
  images?: string[]
  brand?: { id?: number, name?: string | null, slug?: string | null } | null
  category?: { id?: number, name?: string | null, slug?: string | null } | null
  status?: string
  seo?: {
    title: string | null
    description: string | null
    keywords: string | null
    ogTitle: string | null
    ogDescription: string | null
    ogImage: string | null
  } | null
}

type ProductListItem = {
  id: number
  name: string
  slug: string
  image?: string | null
  price: number
  salePrice?: number | null
  discountPercentage?: number | null
  rating?: number | null
  stock?: number | null
  status?: string
  category?: { id: number, name: string, slug: string } | null
  brand?: { id: number, name: string, slug: string } | null
}

const { data: productData, pending, error } = await useFetch<ProductDetail>(`/api/public/products/${route.params.slug}`)

if (error.value || !productData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product Not Found', fatal: true })
}

// Fetch related products by category
const { data: categoryProducts } = await useFetch<{ items: ProductListItem[] }>('/api/public/products', {
  query: {
    categoryId: productData.value?.category?.id,
    pageSize: 15
  },
  key: `related-category-${productData.value?.id}`,
  lazy: true,
  server: false
})

// Fetch related products by brand
const { data: brandProducts } = await useFetch<{ items: ProductListItem[] }>('/api/public/products', {
  query: {
    brandId: productData.value?.brand?.id,
    pageSize: 15
  },
  key: `related-brand-${productData.value?.id}`,
  lazy: true,
  server: false
})

// Filter out current product - no mapping needed, pass directly to carousel
const relatedByCategory = computed(() => {
  if (!categoryProducts.value?.items) return []
  return categoryProducts.value.items
    .filter(p => p.id !== productData.value?.id)
    .slice(0, 12)
})

const relatedByBrand = computed(() => {
  if (!brandProducts.value?.items) return []
  return brandProducts.value.items
    .filter(p => p.id !== productData.value?.id)
    .slice(0, 12)
})

const product = computed(() => productData.value!)
const images = computed(() => (product.value?.images?.length
  ? product.value.images
  : [
      'https://placehold.co/1200x1500/f3f4f6/171717?text=Product'
    ]))

// Use computed for initial value to avoid hydration mismatch
const activeImageIndex = ref(0)
const activeImage = computed(() => images.value[activeImageIndex.value] ?? images.value[0] ?? '')

// Zoom state
const isZoomed = ref(false)
const zoomPosition = ref({ x: 50, y: 50 })

const setActiveImage = (index: number) => {
  activeImageIndex.value = index
}

const nextImage = () => {
  activeImageIndex.value = (activeImageIndex.value + 1) % images.value.length
}

const prevImage = () => {
  activeImageIndex.value = (activeImageIndex.value - 1 + images.value.length) % images.value.length
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextImage()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevImage()
  } else if (e.key === 'Escape') {
    isZoomed.value = false
  }
}

// Zoom handlers
const handleMouseMove = (e: MouseEvent) => {
  if (!isZoomed.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  zoomPosition.value = {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100
  }
}

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// --- SEO & Meta using Nuxt SEO ---
const brandName = computed(() => product.value.brand?.name)
const categoryName = computed(() => product.value.category?.name)

// Use SEO data from API with smart fallbacks that include brand/category
const seoTitle = computed(() => {
  if (product.value.seo?.title) return product.value.seo.title
  const parts = [product.value.name]
  if (brandName.value) parts.push(brandName.value)
  return parts.join(' | ')
})

const seoDescription = computed(() => {
  if (product.value.seo?.description) return product.value.seo.description
  const desc = product.value.shortDescription || product.value.description
  if (desc) return desc
  const parts = [`Buy ${product.value.name}`]
  if (brandName.value) parts.push(`by ${brandName.value}`)
  if (categoryName.value) parts.push(`in ${categoryName.value}`)
  parts.push('at the best price.')
  return parts.join(' ')
})

const seoKeywords = computed(() => {
  if (product.value.seo?.keywords) return product.value.seo.keywords
  // Generate smart keywords from brand, category, and product name
  const keywords: string[] = []
  if (product.value.name) keywords.push(product.value.name)
  if (brandName.value) keywords.push(brandName.value)
  if (categoryName.value) keywords.push(categoryName.value)
  keywords.push('buy online', 'best price', 'Egypt', 'fast delivery')
  return keywords.join(', ')
})

const seoOgImage = computed(() => {
  return product.value.seo?.ogImage || images.value[0] || null
})

const currency = 'EGP'
const productPrice = computed(() => product.value.salePrice ?? product.value.price)

// SEO Meta Tags - Full implementation with keywords
useSeoMeta({
  title: seoTitle,
  ogTitle: computed(() => product.value.seo?.ogTitle || seoTitle.value),
  description: seoDescription,
  ogDescription: computed(() => product.value.seo?.ogDescription || seoDescription.value),
  keywords: seoKeywords,
  ogImage: seoOgImage,
  twitterCard: 'summary_large_image',
  robots: 'index, follow'
})

// Dynamic OG Image for Product
defineOgImageComponent('Product', {
  title: seoTitle,
  price: computed(() => `${productPrice.value} ${currency}`),
  image: computed(() => images.value[0]),
  brand: brandName,
  category: categoryName
})

// Schema.org using nuxt-schema-org
useSchemaOrg([
  defineProduct({
    name: () => product.value.name,
    description: () => seoDescription.value,
    image: () => images.value,
    sku: () => String(product.value.id),
    brand: {
      '@type': 'Brand',
      'name': () => brandName.value || 'Loogy Store'
    },
    offers: [
      defineOffer({
        price: () => productPrice.value,
        priceCurrency: currency,
        availability: product.value.status === 'out_of_stock'
          ? 'OutOfStock'
          : 'InStock',
        itemCondition: 'NewCondition'
      })
    ]
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Products', item: '/products' },
      { name: () => categoryName.value || 'Category', item: () => `/categories/${product.value.category?.slug || ''}` },
      { name: () => product.value.name }
    ]
  })
])

const quantity = ref(1)

const displayPrice = computed(() => product.value?.salePrice ?? product.value?.price ?? 0)
const hasSale = computed(() =>
  typeof product.value?.salePrice === 'number'
  && typeof product.value?.price === 'number'
  && product.value.salePrice < product.value.price
)

const discountPercent = computed(() => {
  if (!hasSale.value || !product.value?.price || !product.value?.salePrice) return null
  return Math.round(((product.value.price - product.value.salePrice) / product.value.price) * 100)
})

const availabilityLabel = computed(() => {
  const status = product.value?.status
  if (status === 'out_of_stock') return 'Out of Stock'
  if (status === 'low_stock') return 'Limited Quantity'
  return 'In Stock'
})

const isInWishlist = computed(() => {
  const id = product.value?.id
  if (!id) return false
  return wishlistItems.value.some(item => item.productId === id)
})

const toggleWishlist = async () => {
  if (!product.value) return
  if (isInWishlist.value) {
    const item = wishlistItems.value.find(i => i.productId === product.value.id)
    if (item) {
      // Pass variantId if it exists in the future, currently undefined
      await removeFromWishlist(product.value.id, undefined)
    }
  } else {
    await addToWishlist({
      title: product.value.name,
      price: product.value.price,
      image: product.value.images?.[0],
      productId: product.value.id
    })
  }
}

const handleAddToCart = async (redirect = false) => {
  if (!product.value) return
  try {
    await addToCart({
      title: product.value.name,
      price: displayPrice.value,
      quantity: quantity.value,
      image: product.value.images?.[0],
      productId: product.value.id
    })

    toast.add({
      title: 'Added to Cart',
      description: product.value.name,
      color: 'success'
    })

    if (redirect) {
      router.push('/checkout')
    }
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Failed to Add to Cart',
      description: err?.data?.message || err?.message || 'Please try again',
      color: 'error'
    })
  }
}

const formatPrice = (value: number) => `${value.toLocaleString('en-US')} EGP`
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <main class="flex-grow pt-20 pb-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="pending" class="py-24 text-center text-neutral-500">
          Loading product...
        </div>
        <div v-else-if="error" class="py-24 text-center text-red-600">
          {{ error?.message || 'Failed to load product' }}
        </div>
        <div v-else class="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <!-- LEFT: Product Visuals (Amazon-style layout) -->
          <div class="lg:w-1/2">
            <div class="sticky top-24 flex flex-row gap-4">
              <!-- Vertical Thumbnails (Left side) - Desktop only -->
              <div class="hidden sm:flex flex-col gap-2 w-20 shrink-0 max-h-[600px] overflow-y-auto scrollbar-hide">
                <button
                  v-for="(img, idx) in images"
                  :key="idx"
                  class="w-20 h-20 shrink-0 border-2 transition-all overflow-hidden bg-gray-50"
                  :class="activeImageIndex === idx ? 'border-black' : 'border-gray-200 hover:border-gray-400'"
                  @click="setActiveImage(idx)"
                  @mouseenter="setActiveImage(idx)"
                >
                  <img :src="img" :alt="`${product?.name} - Image ${idx + 1}`" class="w-full h-full object-cover">
                </button>
              </div>

              <!-- Main Image with Zoom -->
              <div class="flex-1 min-w-0">
                <div
                  class="aspect-[4/5] bg-gray-100 rounded-sm overflow-hidden relative cursor-zoom-in"
                  :class="{ 'cursor-zoom-out': isZoomed }"
                  @click="toggleZoom"
                  @mousemove="handleMouseMove"
                  @mouseleave="isZoomed = false"
                >
                  <img
                    v-if="activeImage"
                    :src="activeImage"
                    :alt="product?.name || ''"
                    class="w-full h-full object-cover transition-transform duration-300"
                    :style="isZoomed ? {
                      transform: 'scale(2)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    } : {}"
                  >
                  <div v-if="hasSale" class="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                    Sale
                  </div>
                  <!-- Navigation arrows -->
                  <button
                    v-if="images.length > 1"
                    type="button"
                    class="product-nav-btn absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
                    @click.stop="prevImage"
                  >
                    <UIcon name="i-heroicons-chevron-left" class="size-5" />
                  </button>
                  <button
                    v-if="images.length > 1"
                    type="button"
                    class="product-nav-btn absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
                    @click.stop="nextImage"
                  >
                    <UIcon name="i-heroicons-chevron-right" class="size-5" />
                  </button>
                  <!-- Image counter -->
                  <div class="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 text-xs font-mono rounded">
                    {{ activeImageIndex + 1 }} / {{ images.length }}
                  </div>
                </div>

                <!-- Mobile Thumbnails (Below image) -->
                <div class="flex sm:hidden gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    v-for="(img, idx) in images"
                    :key="idx"
                    class="w-16 aspect-square shrink-0 border-2 transition-all overflow-hidden"
                    :class="activeImageIndex === idx ? 'border-black' : 'border-gray-200'"
                    @click="setActiveImage(idx)"
                  >
                    <img :src="img" class="w-full h-full object-cover">
                  </button>
                </div>

                <!-- Keyboard hint -->
                <p class="hidden lg:block text-xs text-neutral-400 mt-2 text-center">
                  Use arrow keys to navigate images
                </p>
              </div>
            </div>
          </div>

          <!-- RIGHT: Product Details & EXPRESS CHECKOUT -->
          <div class="lg:w-1/2">
            <div class="max-w-xl">
              <!-- Titles & Price -->
              <div class="mb-8 border-b border-neutral-200 pb-8">
                <p class="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  {{ product?.brand?.name || product?.category?.name || 'Brand' }}
                </p>
                <h1 class="text-4xl lg:text-5xl font-serif font-black uppercase leading-tight mb-4">
                  {{ product?.name }}
                </h1>

                <div class="flex items-center gap-4 mb-6">
                  <span class="text-3xl font-serif font-bold" :class="hasSale ? 'text-red-600' : 'text-neutral-900'">
                    {{ formatPrice(displayPrice) }}
                  </span>
                  <span v-if="hasSale" class="text-xl font-serif text-neutral-400 line-through">
                    {{ formatPrice(product?.price || 0) }}
                  </span>
                  <span v-if="discountPercent" class="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest ml-auto">
                    Save {{ discountPercent }}%
                  </span>
                </div>

                <!-- Social Proof / Urgency -->
                <div class="flex items-center justify-between bg-neutral-100 p-4 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">{{ availabilityLabel }}</span>
                  </div>
                  <div class="text-xs font-mono font-bold text-neutral-500">
                    {{ product?.shortDescription || 'Fast delivery to all governorates' }}
                  </div>
                </div>
              </div>

              <!-- Quantity + Actions -->
              <div class="mb-12 space-y-6">
                <p class="text-sm text-neutral-600">
                  {{ product?.description || 'Additional product details will appear here.' }}
                </p>

                <div class="flex flex-wrap items-center gap-4">
                  <span class="text-xs font-bold uppercase tracking-widest">Quantity</span>
                  <div class="flex items-center border border-neutral-200 rounded-full h-10 w-32">
                    <button
                      type="button"
                      class="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-l-full"
                      @click="quantity = Math.max(1, quantity - 1)"
                    >
                      <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      :value="quantity"
                      readonly
                      class="w-12 text-center text-sm font-bold bg-transparent border-none p-0 focus:ring-0"
                    >
                    <button
                      type="button"
                      class="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-r-full"
                      @click="quantity = quantity + 1"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    class="bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition"
                    @click="handleAddToCart(false)"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    class="bg-white border border-neutral-300 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:border-amber-700 hover:text-amber-700 transition"
                    @click="handleAddToCart(true)"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    class="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-red-500 transition"
                    @click="toggleWishlist"
                  >
                    {{ isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Description / Details (Below fold) -->
        <div class="mt-24 max-w-4xl mx-auto border-t border-neutral-200 pt-16">
          <h3 class="text-2xl font-serif font-black uppercase mb-8 text-center">
            Product Details
          </h3>
          <p class="text-lg text-neutral-600 leading-relaxed text-center font-light">
            {{ product.description }}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <UIcon name="i-heroicons-truck" class="w-8 h-8 mx-auto mb-4" />
              <h4 class="font-bold uppercase tracking-widest text-xs mb-2">
                Free Delivery
              </h4>
              <p class="text-xs text-neutral-500">
                On all orders over $200
              </p>
            </div>
            <div>
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-4" />
              <h4 class="font-bold uppercase tracking-widest text-xs mb-2">
                30 Days Return
              </h4>
              <p class="text-xs text-neutral-500">
                Hassle-free return policy
              </p>
            </div>
            <div>
              <UIcon name="i-heroicons-shield-check" class="w-8 h-8 mx-auto mb-4" />
              <h4 class="font-bold uppercase tracking-widest text-xs mb-2">
                Authenticity
              </h4>
              <p class="text-xs text-neutral-500">
                100% Original Products
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products by Category -->
      <div v-if="relatedByCategory.length > 0 && product.category">
        <StoreProductCarousel
          :title="`More in ${product.category.name}`"
          :items="relatedByCategory"
          :view-all-link="`/products?categorySlug=${product.category.slug}`"
          autoplay
        />
      </div>

      <!-- Related Products by Brand -->
      <div v-if="relatedByBrand.length > 0 && product.brand">
        <StoreProductCarousel
          :title="`More from ${product.brand.name}`"
          :items="relatedByBrand"
          :view-all-link="`/products?brandSlug=${product.brand.slug}`"
          autoplay
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Utility for hiding scrollbar but allowing scroll */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Product navigation buttons - no animation */
.product-nav-btn {
  transition: background-color 0.15s ease !important;
}
</style>

<style>
/* Global override for UCarousel arrows - remove translate animation */
[data-scope="carousel"] button[data-part="prev-trigger"],
[data-scope="carousel"] button[data-part="next-trigger"] {
  transform: translateY(-50%) !important;
  transition: background-color 0.15s ease !important;
}

[data-scope="carousel"] button[data-part="prev-trigger"]:hover,
[data-scope="carousel"] button[data-part="next-trigger"]:hover {
  transform: translateY(-50%) !important;
}
</style>
