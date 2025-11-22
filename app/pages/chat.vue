<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import type { Conversation } from '~/composables/useChat'
import type { SuperAdminSessionUser } from '~/composables/useSuperAdmin'

// definePageMeta({
//   middleware: 'superadmin'
// })

const route = useRoute()
const { connect, conversations, messages, sendMessage, startTyping, stopTyping, openConversation, connected, isTyping } = useChat()
const session = useSessionUser()
const selectedConversation = ref<string | null>(null)
const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()
const searchQuery = ref('')

// Filter conversations by search
const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value

  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter((conv: Conversation) =>
    conv.user.name.toLowerCase().includes(query)
    || conv.user.email.toLowerCase().includes(query)
    || conv.lastMessageContent?.toLowerCase().includes(query)
  )
})

// Get selected conversation data
const activeConversation = computed(() => {
  return conversations.value.find((c: Conversation) => c.id === selectedConversation.value)
})

// Total unread count
const totalUnread = computed(() => {
  return conversations.value.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0)
})

// Connect to chat on mount
onMounted(() => {
  if (session.value) {
    connect(session.value.id, true) // true = isAdmin
  }
})

// Watch for session changes (e.g. hydration)
watch(() => session.value, (newSession: SuperAdminSessionUser | null) => {
  if (newSession) {
    connect(newSession.id, true)
  }
})

// Handle query param selection
watch(() => conversations.value, (newConversations) => {
  const queryId = route.query.id as string
  if (queryId && newConversations.length > 0 && !selectedConversation.value) {
    const conv = newConversations.find((c: Conversation) => c.id === queryId)
    if (conv) {
      selectConversation(queryId)
    }
  }
}, { immediate: true })

// Select conversation
const selectConversation = (conversationId: string) => {
  selectedConversation.value = conversationId
  const conv = conversations.value.find((c: Conversation) => c.id === conversationId)
  if (conv) {
    openConversation(conversationId, conv.userId, true)
    scrollToBottom()
  }
}

// Send message
const handleSendMessage = () => {
  if (!messageInput.value.trim() || !selectedConversation.value || !activeConversation.value) return

  sendMessage(selectedConversation.value, messageInput.value, activeConversation.value.userId, true)
  messageInput.value = ''
  scrollToBottom()
}

// Typing indicator
let typingTimer: NodeJS.Timeout | null = null
const handleTyping = () => {
  if (!selectedConversation.value || !activeConversation.value) return

  startTyping(selectedConversation.value, activeConversation.value.userId, true)

  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    if (selectedConversation.value && activeConversation.value) {
      stopTyping(selectedConversation.value, activeConversation.value.userId, true)
    }
  }, 1000)
}

// Scroll to bottom
const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}

// Format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (hours < 48) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

// Auto-scroll when new messages arrive
watch(() => messages.value.length, () => {
  scrollToBottom()
})
</script>

<template>
  <UDashboardLayout class="w-full">
    <UDashboardPanel grow>
      <UDashboardNavbar title="Live Chat">
        <template #trailing>
          <UBadge
            v-if="totalUnread > 0"
            :label="totalUnread"
            color="red"
            variant="solid"
          />
          <UBadge :label="connected ? 'Connected' : 'Disconnected'" :color="connected ? 'green' : 'red'" variant="subtle" />
        </template>
      </UDashboardNavbar>

      <div class="flex h-[calc(100vh-4rem)]">
        <!-- Conversations List -->
        <div class="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <!-- Search -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search conversations..."
              size="md"
            />
          </div>

          <!-- Conversations -->
          <div class="flex-1 overflow-y-auto">
            <div
              v-for="conv in filteredConversations"
              :key="conv.id"
              class="p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20': selectedConversation === conv.id }"
              @click="selectConversation(conv.id)"
            >
              <div class="flex items-start gap-3">
                <UAvatar
                  :alt="conv.user.name"
                  size="md"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="font-semibold text-sm truncate">{{ conv.user.name }}</span>
                    <span class="text-xs text-gray-500">{{ formatTime(conv.lastMessageAt) }}</span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {{ conv.lastMessageContent || 'No messages yet' }}
                  </p>
                  <UBadge
                    v-if="conv.unreadCount > 0"
                    :label="conv.unreadCount"
                    color="red"
                    size="xs"
                    class="mt-1"
                  />
                </div>
              </div>
            </div>

            <div v-if="filteredConversations.length === 0" class="p-8 text-center text-gray-500">
              <UIcon name="i-lucide-message-circle" class="size-12 mx-auto mb-2 text-gray-400" />
              <p>No conversations found</p>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div v-if="activeConversation" class="flex-1  flex flex-col">
          <!-- Chat Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3">
              <UAvatar :alt="activeConversation.user.name" size="md" />
              <div>
                <h3 class="font-semibold">
                  {{ activeConversation.user.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ activeConversation.user.email }}
                </p>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.isFromAdmin ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[70%] rounded-lg px-4 py-2"
                :class="message.isFromAdmin
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'"
              >
                <p class="text-sm">
                  {{ message.content }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs opacity-75">{{ formatTime(message.createdAt) }}</span>
                  <UIcon
                    v-if="message.isFromAdmin"
                    :name="message.status === 'SEEN' ? 'i-lucide-check-check' : message.status === 'DELIVERED' ? 'i-lucide-check' : 'i-lucide-clock'"
                    class="size-3"
                    :class="message.status === 'SEEN' ? 'text-blue-200' : 'opacity-75'"
                  />
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="flex justify-start">
              <div class="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <div class="flex gap-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-800">
            <form class="flex gap-2" @submit.prevent="handleSendMessage">
              <UInput
                v-model="messageInput"
                placeholder="Type a message..."
                size="lg"
                class="flex-1"
                autofocus
                @input="handleTyping"
              />
              <UButton
                type="submit"
                icon="i-lucide-send"
                size="lg"
                :disabled="!messageInput.trim()"
              >
                Send
              </UButton>
            </form>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 w-full flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-lucide-message-circle" class="size-24 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <h3 class="text-lg font-semibold mb-2">
              Select a conversation
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Choose a conversation to start messaging
            </p>
          </div>
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardLayout>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4a5568;
}
</style>
