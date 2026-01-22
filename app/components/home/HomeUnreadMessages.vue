<script setup lang="ts">
// Messaging feature is currently disabled
</script>

<template>
  <UCard :ui="{ body: { padding: 'p-0' } }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Unread Messages
        </h3>
        <span class="text-xs text-gray-500">Chat disabled</span>
      </div>
    </template>

    <div class="p-8 text-center text-gray-500">
      <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
      <p class="text-sm">
        Messaging is disabled for now.
      </p>
    </div>
  </UCard>
</template>
