<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { Conversation } from '~/composables/useChat'

const { conversations } = useChat()

const unreadConversations = computed(() => {
  return conversations.value
    .filter(c => c.unreadCount > 0)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    .slice(0, 5)
})
</script>

<template>
  <UCard :ui="{ body: { padding: 'p-0' } }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Unread Messages
        </h3>
        <UButton
          to="/chat"
          color="gray"
          variant="ghost"
          size="xs"
        >
          View all
        </UButton>
      </div>
    </template>

    <div v-if="unreadConversations.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
      <NuxtLink
        v-for="conv in unreadConversations"
        :key="conv.id"
        :to="`/chat?id=${conv.id}`"
        class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <UAvatar :alt="conv.user.name" size="md" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ conv.user.name }}
            </p>
            <span class="text-xs text-gray-500">
              {{ useTimeAgo(conv.lastMessageAt).value }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ conv.lastMessageContent }}
          </p>
        </div>
        <UBadge
          color="red"
          variant="solid"
          size="xs"
          :label="conv.unreadCount"
        />
      </NuxtLink>
    </div>

    <div v-else class="p-8 text-center text-gray-500">
      <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
      <p class="text-sm">
        No unread messages
      </p>
    </div>
  </UCard>
</template>
