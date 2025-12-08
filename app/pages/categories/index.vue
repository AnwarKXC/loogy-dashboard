<script setup lang="ts">
import { computed } from 'vue'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const { data, pending, error } = await useFetch('/api/public/categories')

const categories = computed(() => data.value?.categories || [])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flattenCategories = (nodes: any[], depth = 0): any[] =>
  nodes.flatMap(node => [
    { ...node, depth },
    ...(node.children?.length ? flattenCategories(node.children, depth + 1) : [])
  ])

const flatCategories = computed(() => flattenCategories(categories.value))
const topCategories = computed(() => flatCategories.value.slice(0, 8))
</script>

<template>
  <UContainer class="py-12 space-y-10">
    <header class="space-y-2">
      <p class="text-sm uppercase tracking-wide text-muted">
        Catalog
      </p>
      <h1 class="text-3xl font-semibold">
        Browse by category
      </h1>
      <p class="text-muted">
        Explore all categories from the catalog. Counts update automatically as products change.
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
          <h2 class="text-xl font-semibold">
            Featured categories
          </h2>
          <span class="text-sm text-muted">{{ topCategories.length }} categories</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard
            v-for="cat in topCategories"
            :key="cat.slug"
            :ui="{ body: 'space-y-2' }"
            class="hover:border-primary/60 transition"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  {{ cat.depth ? `Subcategory • Level ${cat.depth}` : 'Top level' }}
                </p>
                <h3 class="text-lg font-semibold">
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
            <p class="text-sm text-muted">
              {{ cat._count?.products || 0 }} products
            </p>
          </UCard>
        </div>
      </div>

      <div class="space-y-3">
        <h2 class="text-xl font-semibold">
          All categories
        </h2>
        <div class="border border-default/70 rounded-lg divide-y divide-default/60">
          <div
            v-if="pending"
            class="p-4 text-muted"
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
              <p class="font-medium">
                {{ cat.name }}
              </p>
              <p class="text-xs text-muted">
                {{ cat.depth ? `Level ${cat.depth}` : 'Top level' }} • {{ cat._count?.products || 0 }} products
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
