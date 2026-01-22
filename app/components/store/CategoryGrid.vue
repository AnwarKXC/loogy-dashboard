<script setup lang="ts">
const props = defineProps<{
  title?: string
  categories: Array<{ name: string, to?: string, image?: string }>
}>()
</script>

<template>
  <section id="categories" class="space-y-6" dir="rtl">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Featured Categories
        </p>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ props.title || 'Shop by Category' }}
        </h2>
      </div>
      <ULink to="/categories" class="text-primary font-medium text-sm flex items-center gap-1">
        All Categories
        <UIcon name="i-lucide-arrow-left" class="size-4" />
      </ULink>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <NuxtLink
        v-for="cat in props.categories"
        :key="cat.name"
        :to="cat.to || '/categories'"
        class="group relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        <img
          v-if="cat.image"
          :src="cat.image"
          :alt="cat.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        >
        <div v-else class="h-full w-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div class="absolute bottom-3 right-3 left-3 text-white">
          <p class="font-bold text-lg drop-shadow">{{ cat.name }}</p>
          <p class="text-xs text-white/80">Browse collection</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
