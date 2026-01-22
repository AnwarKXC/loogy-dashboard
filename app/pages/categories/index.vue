<script setup lang="ts">
import { computed } from 'vue'

// @ts-expect-error Nuxt provides definePageMeta globally
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
  // If strict error handling is needed, but usually we just show the alert in template
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

// SEO Meta
const pageTitle = 'كل الفئات'
const pageDescription = 'استعرض جميع فئات المنتجات المتاحة في متجرنا. اعثر على ما تبحث عنه بسهولة من خلال تصفح القوائم المصنفة.'

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
  description: pageDescription,
  ogDescription: pageDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// Structured Data (Schema.org)
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': pageTitle,
        'description': pageDescription,
        'isPartOf': {
          '@type': 'WebSite',
          'name': 'The Store' // You might want to pull this from app config
        },
        'breadcrumb': {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': 'https://example.com' // Should be dynamically set
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Categories',
              'item': 'https://example.com/categories'
            }
          ]
        }
      })
    }
  ]
})
</script>

<template>
  <UContainer class="py-12 space-y-10">
    <header class="space-y-2">
      <p class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
        الكتالوج
      </p>
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-gray-100">
        تصفح حسب الفئة
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        استعرض جميع الفئات من الكتالوج. الأعداد تتحدث تلقائياً مع تغير المنتجات.
      </p>
    </header>

    <UAlert
      v-if="error"
      color="red"
      icon="i-lucide-alert-triangle"
      title="تعذر تحميل الفئات"
      :description="error?.message || 'حاول مرة أخرى.'"
    />

    <div v-else class="space-y-10">
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            فئات مميزة
          </h2>
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ topCategories.length }} فئة</span>
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
                  {{ cat.depth ? `فئة فرعية • المستوى ${cat.depth}` : 'المستوى الرئيسي' }}
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
                aria-label="فتح الفئة"
              />
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ cat._count?.products || 0 }} منتج
            </p>
          </UCard>
        </div>
      </div>

      <div class="space-y-3">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          كل الفئات
        </h2>
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <div
            v-if="pending"
            class="p-4 text-gray-600 dark:text-gray-400"
          >
            جاري تحميل الفئات...
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
                {{ cat.depth ? `المستوى ${cat.depth}` : 'رئيسي' }} • {{ cat._count?.products || 0 }} منتج
              </p>
            </div>
            <UButton
              :to="`/categories/${cat.slug}`"
              variant="ghost"
              size="xs"
              icon="i-lucide-chevron-right"
              aria-label="عرض الفئة"
            />
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
