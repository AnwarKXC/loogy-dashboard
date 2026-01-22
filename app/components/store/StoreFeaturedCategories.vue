<script setup lang="ts">
const props = defineProps<{
  categories: Array<{ name: string, to?: string, image?: string, count?: number }>
}>()
</script>

<template>
  <section class="space-y-6" dir="rtl">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Featured Categories
        </p>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Browse our featured categories
        </h2>
      </div>
      <ULink to="/categories" class="text-primary font-medium text-sm flex items-center gap-1">
        All Categories
        <UIcon name="i-lucide-arrow-left" class="size-4" />
      </ULink>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink
        v-for="cat in props.categories"
        :key="cat.name"
        :to="cat.to || '/categories'"
        class="group relative overflow-hidden rounded-xl h-56 bg-gray-100 dark:bg-gray-800"
      >
        <img
          v-if="cat.image"
          :src="cat.image"
          :alt="cat.name"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div class="absolute bottom-4 right-4 left-4 text-white space-y-2">
          <p class="text-lg font-bold">{{ cat.name }}</p>
          <p class="text-sm text-white/80">{{ cat.count || 0 }} products</p>
          <span class="inline-block text-sm bg-white/20 backdrop-blur px-3 py-1 rounded-full group-hover:bg-white/30 transition">
            View Details
          </span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
