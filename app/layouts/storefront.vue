<script setup lang="ts">
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-gradient-to-b from-white via-slate-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100"
  >
    <StoreHeader />
    <main class="flex-1">
      <slot />
    </main>
    <StoreFooter />
  </div>
</template>
