<script setup lang="ts">
import { computed } from 'vue'

type ProductItem = {
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

const props = withDefaults(defineProps<{
  title: string
  items: ProductItem[]
  autoplay?: boolean
  viewAllLink?: string
}>(), {
  autoplay: true
})

const hasItems = computed(() => props.items.length > 0)

const formatPrice = (value: number) => `${value.toLocaleString('en-US')} EGP`

const getDiscountPercent = (price: number, salePrice?: number | null) => {
  if (!salePrice || salePrice >= price) return null
  return Math.round(((price - salePrice) / price) * 100)
}
</script>

<template>
  <section class="py-12">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl lg:text-4xl font-serif font-black uppercase text-neutral-900">
          {{ title }}
        </h2>
        <NuxtLink
          :to="viewAllLink || '/products'"
          class="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition flex items-center gap-2"
        >
          Show More
          <UIcon name="i-heroicons-arrow-right" class="size-4" />
        </NuxtLink>
      </div>

      <div v-if="hasItems" class="product-carousel-wrapper">
        <UCarousel
          v-slot="{ item }"
          :items="items"
          :autoplay="props.autoplay ? { delay: 3000, stopOnInteraction: true } : false"
          :ui="{
            item: 'basis-full sm:basis-1/2 lg:basis-1/4 pr-4',
            container: 'snap-x snap-mandatory'
          }"
          arrows
          loop
        >
          <NuxtLink :to="`/products/${item.slug}`" class="group cursor-pointer w-full relative block">
            <div class="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                draggable="false"
              >
              <div v-else class="w-full h-full flex items-center justify-center text-neutral-400">
                <UIcon name="i-lucide-image" class="size-12" />
              </div>
              <!-- Sale Badge -->
              <div
                v-if="getDiscountPercent(item.price, item.salePrice)"
                class="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
              >
                -{{ getDiscountPercent(item.price, item.salePrice) }}%
              </div>
            </div>
            <h3 class="font-bold uppercase text-sm mb-1 text-neutral-900 line-clamp-2">
              {{ item.name }}
            </h3>
            <div class="flex items-center gap-2">
              <p class="font-serif" :class="item.salePrice ? 'text-red-600' : 'text-neutral-500'">
                {{ formatPrice(item.salePrice || item.price) }}
              </p>
              <p v-if="item.salePrice && item.salePrice < item.price" class="font-serif text-neutral-400 line-through text-sm">
                {{ formatPrice(item.price) }}
              </p>
            </div>
          </NuxtLink>
        </UCarousel>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Remove ALL transform animations on carousel arrows */
.product-carousel-wrapper :deep(button) {
  transform: translateY(0) !important;
  transition: background-color 0.15s ease !important;
}

.product-carousel-wrapper :deep(button:hover) {
  transform: translateY(0) !important;
}

/* Target specific carousel navigation buttons */
.product-carousel-wrapper :deep([data-scope="carousel"] button),
.product-carousel-wrapper :deep([data-part="prev-trigger"]),
.product-carousel-wrapper :deep([data-part="next-trigger"]) {
  transform: translateY(0) !important;
}

.product-carousel-wrapper :deep([data-scope="carousel"] button:hover),
.product-carousel-wrapper :deep([data-part="prev-trigger"]:hover),
.product-carousel-wrapper :deep([data-part="next-trigger"]:hover) {
  transform: translateY(0) !important;
  background-color: rgba(0, 0, 0, 0.9) !important;
}
</style>
