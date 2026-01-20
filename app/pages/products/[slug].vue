// @ts-nocheck
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const route = useRoute()
const slug = route.params.slug as string
const toast = useToast()

const { data: productData, pending, error } = await useFetch(`/api/public/products/${slug}`)
const { data: relatedData } = await useFetch('/api/public/products', { query: { pageSize: 4, sort: 'featured' } })

const product = computed(() => productData.value || {})
// images is String[] (array of URL strings)
const galleryImages = computed(() => product.value.images || [])
const { add: addToCart } = useCart()
const { add: addToWishlist, remove: removeFromWishlist, items: wishlistItems } = useWishlist()

const selectedImage = ref<string | null>(null)
const liveViewers = computed(() => 28 + (product.value.id || 1) % 12)

const isWishlisted = computed(() => wishlistItems.value.some(i => i.productId === product.value.id))

const handleAddToCart = () => {
  addToCart({
    title: product.value.name,
    price: product.value.salePrice ?? product.value.price,
    quantity: 1,
    image: product.value.images?.[0],
    productId: product.value.id
  })
  toast.add({ title: 'تمت الإضافة للسلة', color: 'success' })
}

const toggleWishlist = () => {
  if (isWishlisted.value) {
    removeFromWishlist(product.value.id)
  } else {
    addToWishlist({
      title: product.value.name,
      price: product.value.price,
      image: product.value.images?.[0],
      productId: product.value.id
    })
  }
}

const relatedProducts = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (relatedData.value?.items || []).map((item: any) => ({
    title: item.name,
    price: item.price,
    salePrice: item.salePrice,
    image: item.image,
    rating: item.rating ?? 4.8,
    to: `/products/${item.slug}`,
    productId: item.id
  }))
)
</script>

<template>
  <UContainer class="py-12 space-y-10">
    <UAlert
      v-if="error"
      color="red"
      icon="i-lucide-alert-triangle"
      :description="error?.message || 'تعذر تحميل المنتج'"
    />

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div class="space-y-4">
        <UCarousel
          v-if="galleryImages.length"
          v-slot="{ item }"
          :items="galleryImages"
          arrows
          dots
          :ui="{ item: 'basis-full' }"
        >
          <img
            :src="selectedImage || item"
            :alt="product.name"
            class="w-full rounded-2xl ring-1 ring-default"
            loading="lazy"
          >
        </UCarousel>
        <div v-else class="aspect-[4/5] rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-gray-800 dark:to-gray-700 ring-1 ring-default flex items-center justify-center text-gray-500 dark:text-gray-300">
          لا توجد صور متاحة
        </div>
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="thumb in galleryImages"
            :key="thumb"
            type="button"
            class="rounded-xl overflow-hidden ring-2"
            :class="selectedImage === thumb ? 'ring-primary' : 'ring-transparent'"
            @click="selectedImage = thumb"
          >
            <img
              :src="thumb"
              :alt="product.name"
              class="w-full h-full object-cover"
              loading="lazy"
            >
          </button>
        </div>
      </div>

      <div class="space-y-4" dir="rtl">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          يشاهد الآن: {{ liveViewers }} عميل
        </p>
        <h1 class="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          {{ product.name }}
        </h1>
        <div class="flex items-center gap-2 text-amber-500">
          <UIcon name="i-lucide-star" />
          <span>{{ product.rating || '4.8' }}</span>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <p class="text-2xl font-bold text-primary">
            {{ (product.salePrice ?? product.price)?.toLocaleString('ar-EG') }} ج.م
          </p>
          <p v-if="product.salePrice" class="text-gray-400 dark:text-gray-500 line-through">
            {{ product.price?.toLocaleString('ar-EG') }} ج.م
          </p>
        </div>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          {{ product.description }}
        </p>

        <div class="flex flex-wrap gap-3">
          <UButton
            icon="i-lucide-shopping-cart"
            color="primary"
            :loading="pending"
            @click="handleAddToCart"
          >
            أضف للسلة
          </UButton>
          <UButton
            :icon="isWishlisted ? 'i-lucide-heart-off' : 'i-lucide-heart'"
            variant="ghost"
            :color="isWishlisted ? 'primary' : 'neutral'"
            @click="toggleWishlist"
          >
            {{ isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة' }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h2 class="text-xl font-semibold">
        منتجات ذات صلة
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductCard
          v-for="product in relatedProducts"
          :key="product.productId"
          v-bind="product"
        />
      </div>
    </div>
  </UContainer>
</template>
