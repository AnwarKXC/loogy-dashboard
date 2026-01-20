<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  title: string
  items: Array<{
    title: string
    price: number
    salePrice?: number
    image?: string
    rating?: number
    to?: string
    productId?: number | string
  }>
  autoplay?: boolean
  viewAllLink?: string
}>()

const carouselRef = ref()
const hasItems = computed(() => props.items.length > 0)
</script>

<template>
  <section class="space-y-6" dir="rtl">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ title }}
      </h2>
      <ULink :to="viewAllLink || '/products'" class="text-primary font-medium text-sm flex items-center gap-1">
        المزيد
        <UIcon name="i-lucide-arrow-left" class="size-4" />
      </ULink>
    </div>

    <div v-if="hasItems" class="relative group">
      <UCarousel
        ref="carouselRef"
        v-slot="{ item }"
        :items="items"
        :autoplay="props.autoplay ? { delay: 4000 } : false"
        :ui="{
          item: 'basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-4',
          container: 'ml-[-16px]',
          indicators: { wrapper: 'bottom-[-24px]' }
        }"
        class="pb-8"
      >
        <StoreProductCard v-bind="item" class="h-full" />
      </UCarousel>

      <!-- Custom Arrows -->
      <button
        class="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        @click="carouselRef?.prev()"
      >
        <UIcon name="i-lucide-chevron-right" class="size-6 text-gray-900 dark:text-gray-100" />
      </button>

      <button
        class="absolute top-1/2 -translate-y-1/2 left-2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        @click="carouselRef?.next()"
      >
        <UIcon name="i-lucide-chevron-left" class="size-6 text-gray-900 dark:text-gray-100" />
      </button>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="i in 5"
        :key="i"
        class="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
      />
    </div>
  </section>
</template>
