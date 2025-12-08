<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-white via-slate-50 to-white text-gray-900">
    <StoreHeader />
    <main class="flex-1">
      <slot />
    </main>
    <StoreFooter />
  </div>
</template>
