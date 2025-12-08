<script setup lang="ts">
import { computed } from 'vue'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const hero = {
  title: 'Elevate your store with Loogy',
  description: 'Fast storefront, Paymob-ready checkout, and reusable components to ship projects quickly.'
}

const { data: productsData } = await useFetch('/api/public/products', {
  query: { pageSize: 8, sort: 'featured' }
})

const { data: categoriesData } = await useFetch('/api/public/categories')

const featuredProducts = computed(() =>
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

const categories = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (categoriesData.value?.categories || []).slice(0, 4).map((cat: any) => ({
    name: cat.name,
    to: `/categories/${cat.slug}`,
    image: undefined
  }))
)

const deals = computed(() => featuredProducts.value.slice(0, 4))

const reviews = [
  { name: 'Sara M.', title: 'Fast delivery', body: 'Checkout was smooth and Paymob worked flawlessly. Products arrived in 2 days!', rating: 5 },
  { name: 'Omar K.', title: 'Great UX', body: 'The UI feels premium and the cart kept my items even after logout.', rating: 5 },
  { name: 'Nour A.', title: 'Easy to customize', body: 'Loved how quickly I could adapt the template for my brand.', rating: 4 }
]
</script>

<template>
  <div class="space-y-16 pb-20">
    <HeroSection :title="hero.title" :description="hero.description" />

    <UContainer>
      <StoreProductCarousel title="Trending now" :items="featuredProducts" autoplay />

      <div class="mt-12">
        <StoreCategoryGrid :categories="categories" />
      </div>

      <div id="deals" class="mt-12">
        <StoreProductCarousel title="Fawry deals" :items="deals" />
      </div>

      <div class="mt-12">
        <StoreCustomerReviews :reviews="reviews" />
      </div>

      <div class="mt-12">
        <StoreSocialMediaLinks />
      </div>
    </UContainer>

    <StoreChatWidget />
  </div>
</template>
