<script setup lang="ts">
defineProps<{
  title: string
  price?: string
  image?: string
  brand?: string
  category?: string
}>()
</script>

<template>
  <div class="w-full h-full flex bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-12">
    <!-- Product Image -->
    <div class="w-1/2 h-full flex items-center justify-center pr-8">
      <div v-if="image" class="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
        <img :src="image" class="w-full h-full object-cover" alt="">
      </div>
      <div v-else class="w-full h-full rounded-2xl bg-neutral-700 flex items-center justify-center">
        <span class="text-6xl">📦</span>
      </div>
    </div>

    <!-- Product Info -->
    <div class="w-1/2 flex flex-col justify-center pl-8">
      <!-- Brand/Category Badge -->
      <div v-if="brand || category" class="mb-4">
        <span class="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
          {{ brand || category }}
        </span>
      </div>

      <!-- Title -->
      <h1 class="text-5xl font-bold leading-tight mb-6 line-clamp-3">
        {{ title }}
      </h1>

      <!-- Price -->
      <div v-if="price" class="text-4xl font-bold text-amber-400 mb-8">
        {{ price }}
      </div>

      <!-- Store Branding -->
      <div class="mt-auto flex items-center gap-4">
        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <span class="text-2xl">🛒</span>
        </div>
        <div>
          <p class="text-xl font-bold">Loogy Store</p>
          <p class="text-neutral-400 text-sm">Best products at best prices</p>
        </div>
      </div>
    </div>
  </div>
</template>
