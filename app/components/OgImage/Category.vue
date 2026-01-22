<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  productCount?: number
  image?: string
}>()
</script>

<template>
  <div class="w-full h-full flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
    <!-- Background Image with Overlay -->
    <div v-if="image" class="absolute inset-0">
      <img :src="image" class="w-full h-full object-cover opacity-30" alt="">
      <div class="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full h-full flex flex-col justify-center p-16">
      <!-- Category Badge -->
      <span class="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider w-max mb-6">
        Product Category
      </span>

      <!-- Title -->
      <h1 class="text-6xl font-bold leading-tight mb-4">
        {{ title }}
      </h1>

      <!-- Subtitle -->
      <p v-if="subtitle" class="text-2xl text-neutral-300 mb-6 max-w-2xl">
        {{ subtitle }}
      </p>

      <!-- Product Count -->
      <div v-if="productCount" class="flex items-center gap-2 text-xl text-neutral-400">
        <span class="text-3xl">📦</span>
        <span>{{ productCount }} products available</span>
      </div>

      <!-- Store Branding -->
      <div class="mt-auto flex items-center gap-4 pt-8">
        <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center">
          <span class="text-3xl">🛒</span>
        </div>
        <div>
          <p class="text-2xl font-bold">
            Loogy Store
          </p>
          <p class="text-neutral-400">
            loogy.store
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
