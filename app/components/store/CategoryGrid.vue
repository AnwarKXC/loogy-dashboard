<script setup lang="ts">
const props = defineProps<{
  title?: string
  categories: Array<{ name: string, to?: string, image?: string }>
}>()
</script>

<template>
  <section id="categories" class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        {{ props.title || 'Shop by category' }}
      </h2>
      <ULink to="/categories" class="text-primary font-medium">All categories</ULink>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <UCard v-for="cat in props.categories" :key="cat.name" class="hover:ring-2 hover:ring-primary/60 transition">
        <NuxtLink :to="cat.to || '/categories'" class="block space-y-2">
          <div class="aspect-square rounded-md bg-gradient-to-br from-slate-100 to-white overflow-hidden">
            <img
              v-if="cat.image"
              :src="cat.image"
              :alt="cat.name"
              class="w-full h-full object-cover"
              loading="lazy"
            >
            <div v-else class="flex h-full items-center justify-center text-muted text-sm">{{ cat.name }}</div>
          </div>
          <p class="font-medium">{{ cat.name }}</p>
        </NuxtLink>
      </UCard>
    </div>
  </section>
</template>
