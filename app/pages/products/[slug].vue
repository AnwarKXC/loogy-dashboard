// @ts-nocheck
<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const route = useRoute()
const slug = route.params.slug as string

const product = reactive({
  title: slug,
  price: 1999,
  salePrice: 1799,
  rating: 4.8,
  description: 'Premium product description goes here.',
  images: [
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200',
    'https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=1200'
  ]
})
</script>

<template>
  <UContainer class="py-12 space-y-10">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div class="space-y-4">
        <UCarousel
          v-slot="{ item }"
          :items="product.images"
          arrows
          dots
          :ui="{ item: 'basis-full' }"
        >
          <img
            :src="item"
            :alt="product.title"
            class="w-full rounded-2xl ring-1 ring-default"
            loading="lazy"
          >
        </UCarousel>
      </div>

      <div class="space-y-4">
        <h1 class="text-3xl font-semibold">
          {{ product.title }}
        </h1>
        <div class="flex items-center gap-2 text-amber-500">
          <UIcon name="i-lucide-star" />
          <span>{{ product.rating }}</span>
        </div>
        <div class="flex items-center gap-3">
          <p class="text-2xl font-bold">
            {{ product.salePrice }} EGP
          </p>
          <p class="text-muted line-through">
            {{ product.price }} EGP
          </p>
        </div>
        <p class="text-muted leading-relaxed">
          {{ product.description }}
        </p>

        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-shopping-cart" color="primary">
            Add to cart
          </UButton>
          <UButton icon="i-lucide-heart" variant="ghost">
            Wishlist
          </UButton>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h2 class="text-xl font-semibold">
        Related products
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductCard
          v-for="idx in 4"
          :key="idx"
          title="Related Item"
          :price="999 + idx * 50"
          image="https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=600"
          to="/products/example"
        />
      </div>
    </div>
  </UContainer>
</template>
