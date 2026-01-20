<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const { data: featuredProductsData } = await useFetch('/api/public/products', {
  query: { pageSize: 12, sort: 'featured' }
})

const { data: newestProductsData } = await useFetch('/api/public/products', {
  query: { pageSize: 12, sort: 'newest' }
})

const { data: bestSellerData } = await useFetch('/api/public/products', {
  query: { pageSize: 12, sort: 'bestseller' }
})

const { data: categoriesData } = await useFetch('/api/public/categories')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProducts = (data?: any) => (data?.items || []).map((item: any) => ({
  title: item.name,
  price: item.price,
  salePrice: item.salePrice,
  image: item.image,
  rating: item.rating ?? 4.8,
  to: `/products/${item.slug}`,
  productId: item.id
}))

const featuredProducts = computed(() => mapProducts(featuredProductsData.value))
const latestProducts = computed(() => mapProducts(newestProductsData.value))
const bestSellerProducts = computed(() => {
  const mapped = mapProducts(bestSellerData.value)
  return mapped.length ? mapped : featuredProducts.value.slice(0, 10)
})
const suggestedProducts = computed(() => featuredProducts.value.slice(0, 8))

const heroSlides = [
  {
    title: 'كولكشن الشتاء وصل',
    description: 'معاطف، بلوفرات، وأحذية بخصومات حتى 40% مع شحن سريع.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1400',
    to: '/categories/winter'
  },
  {
    title: 'أحذية الموسم',
    description: 'تشكيلة الأحذية الرجالي والحريمي الجديدة.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1400',
    to: '/categories/shoes'
  },
  {
    title: 'عروض الصيف',
    description: 'تيشيرتات وقمصان خفيفة بأسعار خاصة.',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400',
    to: '/categories/summer'
  }
]

const featuredCategories = computed(() => {
  const cats = categoriesData.value?.categories || []
  // Use sample images for categories that don't have images
  const categoryImages = [
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600', // Men
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', // Women
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600', // Shoes
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' // Bags
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cats.slice(0, 4).map((cat: any, idx: number) => ({
    name: cat.name,
    to: `/categories/${cat.slug}`,
    image: categoryImages[idx % categoryImages.length],
    count: cat._count?.products || 0
  }))
})

const categoryGrid = computed(() => {
  const cats = categoriesData.value?.categories || []
  const categoryImages = [
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=600', // Accessories
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600' // Winter
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cats.slice(0, 6).map((cat: any, idx: number) => ({
    name: cat.name,
    to: `/categories/${cat.slug}`,
    image: categoryImages[idx % categoryImages.length]
  }))
})

const reviews = [
  { name: 'سارة', title: 'تسليم سريع', body: 'الدفع والدليفري كانوا سلسين جداً. الطلب وصلني خلال يومين!', rating: 5 },
  { name: 'عمر', title: 'جودة ممتازة', body: 'التجربة كانت قريبة من تركيا ستور. المنتجات مطابقة للصور.', rating: 5 },
  { name: 'نور', title: 'دعم رائع', body: 'تواصلت مع الدعم عبر واتساب وردوا بسرعة وحلوا مشكلتي.', rating: 4 }
]
</script>

<template>
  <div class="space-y-20 pb-20 bg-gray-50/50 dark:bg-gray-950">
    <StoreHeroBannerSlider :slides="heroSlides" />

    <UContainer class="space-y-24">
      <!-- Unique styling for Categories -->
      <StoreCategoryGrid :categories="categoryGrid" title="الأقسام الرائجة" />

      <!-- Featured Section -->
      <StoreFeaturedCategories :categories="featuredCategories" />

      <!-- Carousels with different styling/backgrounds if feasible -->
      <StoreProductCarousel title="عروض مميزة" :items="featuredProducts" autoplay />

      <StoreProductCarousel id="deals" title="مقترحة لك" :items="suggestedProducts" />

      <StoreFeatures />

      <StoreProductCarousel title="الأكثر مبيعاً" :items="bestSellerProducts" />

      <div class="bg-primary-50 dark:bg-primary-900/10 -mx-4 sm:-mx-8 px-4 sm:px-8 py-12 rounded-3xl">
        <StoreProductCarousel title="أحدث المنتجات" :items="latestProducts" />
      </div>

      <StoreCustomerReviews :reviews="reviews" />

      <StoreSocialMediaLinks />
    </UContainer>

    <StoreChatWidget />
  </div>
</template>
