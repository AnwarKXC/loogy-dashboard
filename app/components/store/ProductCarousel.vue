<script setup lang="ts">
import { computed } from 'vue'
import type { CarouselItem } from '@nuxt/ui'

const props = defineProps<{
  title: string
  items: Array<{
    title: string
    price: number
    salePrice?: number
    image?: string
    rating?: number
    to?: string
  }>
  autoplay?: boolean
}>()

const carouselItems = computed<CarouselItem[]>(() => props.items.map(item => ({
  ...item,
  class: 'basis-1/1 sm:basis-1/2 lg:basis-1/3'
})))
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        {{ title }}
      </h2>
      <ULink to="/products" class="text-primary font-medium">See all</ULink>
    </div>

    <UCarousel
      v-slot="{ item }"
      arrows
      dots
      :items="carouselItems"
      :autoplay="props.autoplay ? { delay: 3000 } : false"
      :ui="{ item: 'px-2 sm:px-3 lg:px-4' }"
    >
      <ProductCard v-bind="item" />
    </UCarousel>
  </section>
</template>
