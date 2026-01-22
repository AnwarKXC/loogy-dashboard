<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  layout: 'storefront'
})

// Define TypeScript interfaces for API response
interface CategoryNode {
  id: number
  slug: string
  name: string
  depth?: number
  image?: string | null
  _count?: { products?: number }
  children?: CategoryNode[]
}

interface CategoriesResponse {
  categories: CategoryNode[]
  featured: CategoryNode[]
}

// Fetch data with proper typing
const { data, pending, error } = await useFetch<CategoriesResponse>('/api/public/storefront/categories')

// Handle 404/Error if necessary (though index usually returns 200 with empty list)
if (error.value) {
  console.error('Failed to load categories', error.value)
}

const categories = computed<CategoryNode[]>(() => data.value?.categories ?? [])
const featured = computed<CategoryNode[]>(() => data.value?.featured ?? [])

const flattenCategories = (nodes: CategoryNode[], depth = 0): CategoryNode[] =>
  nodes.flatMap(node => [
    { ...node, depth },
    ...(node.children?.length ? flattenCategories(node.children, depth + 1) : [])
  ])

const flatCategories = computed(() => flattenCategories(categories.value))
const topCategories = computed(() => (featured.value.length ? featured.value : flatCategories.value.slice(0, 8)))

// SEO using Nuxt SEO
const pageTitle = 'All Categories'
const pageDescription = 'Browse all product categories available in our store. Find what you are looking for easily by exploring the categorized lists.'

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
  description: pageDescription,
  ogDescription: pageDescription,
  twitterCard: 'summary_large_image',
  robots: 'index, follow'
})

// OG Image
defineOgImageComponent('Category', {
  title: pageTitle,
  subtitle: pageDescription,
  productCount: computed(() => flatCategories.value.length)
})

// Schema.org using nuxt-schema-org
useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    'name': pageTitle,
    'description': pageDescription
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Categories' }
    ]
  }),
  defineItemList({
    itemListElement: computed(() =>
      topCategories.value.map((cat, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': `/categories/${cat.slug}`,
        'name': cat.name,
        'image': cat.image
      }))
    )
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-10">
    <header class="space-y-2">
      <p class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
        CATALOG
      </p>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-gray-100">
        Browse by Category
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Browse all categories from the catalog. The counts update automatically with product changes.
      </p>
    </header>

    <UAlert
      v-if="error"
      color="red"
      icon="i-lucide-alert-triangle"
      title="Failed to load categories"
      :description="error?.message || 'Please try again.'"
    />

    <div v-else class="space-y-10">
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Featured Categories
          </h2>
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ topCategories.length }} categories</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard
            v-for="cat in topCategories"
            :key="cat.slug"
            :ui="{ body: 'space-y-2' }"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/60 transition"
          >
            <div v-if="cat.image" class="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img :src="cat.image" :alt="cat.name" class="w-full h-full object-cover">
            </div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ cat.depth ? `Subcategory • Level ${cat.depth}` : 'Main Level' }}
                </p>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{ cat.name }}
                </h3>
              </div>
              <UButton
                :to="`/categories/${cat.slug}`"
                size="xs"
                variant="ghost"
                icon="i-lucide-arrow-up-right"
                aria-label="Open category"
              />
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ cat._count?.products || 0 }} products
            </p>
          </UCard>
        </div>
      </div>

      <div class="space-y-3">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          All Categories
        </h2>
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <div
            v-if="pending"
            class="p-4 text-gray-600 dark:text-gray-400"
          >
            Loading categories...
          </div>
          <div
            v-for="cat in flatCategories"
            v-else
            :key="cat.slug"
            class="flex items-center justify-between px-4 py-3"
            :style="{ paddingLeft: `${16 + cat.depth * 16}px` }"
          >
            <div class="space-y-1">
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ cat.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ cat.depth ? `Level ${cat.depth}` : 'Main' }} • {{ cat._count?.products || 0 }} products
              </p>
            </div>
            <UButton
              :to="`/categories/${cat.slug}`"
              variant="ghost"
              size="xs"
              icon="i-lucide-chevron-right"
              aria-label="View category"
            />
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
