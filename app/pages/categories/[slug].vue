<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'storefront'
})

const route = useRoute()
const slug = route.params.slug as string

interface CategoryDetail {
  id: number
  name: string
  slug: string
  image?: string | null
  description?: string | null
}

// Fetch Category Details
const { data: categoryData, error: categoryError } = await useFetch<CategoryDetail>(`/api/public/storefront/categories/${slug}`)

if (!categoryData.value || categoryError.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Category Not Found',
    fatal: true
  })
}

// Fetch Products in Category
const { data: productsData, pending } = await useFetch('/api/public/products', {
  query: { categorySlug: slug, pageSize: 12 }
})

const products = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (productsData.value?.items || []).map((item: any) => ({
    title: item.name,
    price: item.price,
    salePrice: item.salePrice,
    image: item.image,
    rating: item.rating ?? 4.8,
    to: `/products/${item.slug}`,
    productId: item.id
  }))
)

// Computed Properties
const categoryName = computed(() => categoryData.value?.name || slug)
const categoryImage = computed(() => categoryData.value?.image)
const categoryDesc = computed(() => categoryData.value?.description || `تسوق أفضل المنتجات في قسم ${categoryName.value}.`)
const productCount = computed(() => productsData.value?.pagination?.totalItems || 0)
const filterLink = computed(() => `/products?category=${slug}`)

// SEO using Nuxt SEO
useSeoMeta({
  title: categoryName,
  ogTitle: categoryName,
  description: categoryDesc,
  ogDescription: categoryDesc,
  twitterCard: 'summary_large_image',
  robots: 'index, follow'
})

// Dynamic OG Image
defineOgImageComponent('Category', {
  title: categoryName,
  subtitle: categoryDesc,
  productCount: productCount,
  image: categoryImage
})

// Schema.org using nuxt-schema-org
useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    'name': () => categoryName.value,
    'description': () => categoryDesc.value,
    'image': () => categoryImage.value
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'الرئيسية', item: '/' },
      { name: 'الفئات', item: '/categories' },
      { name: () => categoryName.value }
    ]
  }),
  defineItemList({
    itemListElement: computed(() =>
      products.value.map((prod, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': prod.to,
        'name': prod.title,
        'image': prod.image
      }))
    )
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-8">
    <div v-if="categoryData?.image" class="aspect-[3/1] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img :src="categoryData.image" :alt="categoryName" class="w-full h-full object-cover">
    </div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold capitalize text-gray-900 dark:text-gray-100">
          {{ categoryName }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          تصفح المنتجات في هذه الفئة.
        </p>
      </div>
      <UButton :to="filterLink" icon="i-lucide-filter" variant="soft">
        الفلاتر
      </UButton>
    </div>

    <div v-if="pending" class="text-gray-600 dark:text-gray-400">
      جاري تحميل المنتجات...
    </div>
    <div v-else-if="productCount === 0" class="text-center py-12">
      <UIcon name="i-lucide-package" class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
      <p class="mt-3 text-gray-600 dark:text-gray-400">
        لا توجد منتجات في هذه الفئة حالياً.
      </p>
      <UButton to="/products" class="mt-4" color="primary">
        تصفح كل المنتجات
      </UButton>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProductCard v-for="product in products" :key="product.productId" v-bind="product" />
    </div>
  </UContainer>
</template>
