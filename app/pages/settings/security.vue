<script setup lang="ts">
definePageMeta({
  middleware: () => {
    return navigateTo('/settings', { replace: true })
  }
})
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <USkeleton class="h-24 w-full max-w-md" />
  </div>
</template>
