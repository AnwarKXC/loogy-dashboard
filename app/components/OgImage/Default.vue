<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="w-full h-full flex bg-gradient-to-br from-neutral-900 via-neutral-800 to-black text-white relative overflow-hidden">
    <!-- Decorative Elements -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />

    <!-- Content -->
    <div class="relative z-10 w-full h-full flex flex-col items-center justify-center p-16 text-center">
      <!-- Logo -->
      <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
        <span class="text-5xl">🛒</span>
      </div>

      <!-- Store Name -->
      <h1 class="text-7xl font-black uppercase tracking-tight mb-4">
        {{ title || 'Loogy Store' }}
      </h1>

      <!-- Tagline -->
      <p class="text-2xl text-neutral-300 max-w-2xl">
        {{ description || 'أفضل المنتجات بأفضل الأسعار. شحن سريع لجميع المحافظات.' }}
      </p>

      <!-- Features -->
      <div class="flex gap-8 mt-12 text-sm uppercase tracking-wider text-neutral-400">
        <span class="flex items-center gap-2">
          <span class="text-xl">🚚</span> شحن سريع
        </span>
        <span class="flex items-center gap-2">
          <span class="text-xl">💯</span> جودة عالية
        </span>
        <span class="flex items-center gap-2">
          <span class="text-xl">🔒</span> دفع آمن
        </span>
      </div>
    </div>
  </div>
</template>
