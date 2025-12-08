<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, reactive } from 'vue'

import type { Conversation } from '~/composables/useChat'
import type { SuperAdminSessionUser } from '~/composables/useSuperAdmin'

const route = useRoute()
const { connect, conversations, messages, sendMessage, sendAttachments, startTyping, stopTyping, openConversation, connected, isTyping } = useChat()
const session = useSessionUser()
const selectedConversation = ref<string | null>(null)
const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()
const searchQuery = ref('')
const isUploading = ref(false)
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks: BlobPart[] = []
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFiles = ref<File[]>([])
const dragActive = ref(false)
const recordingTimer = ref<NodeJS.Timeout | null>(null)
const recordingDurationMs = ref(0)
const accumulatedMs = ref(0)
const isPaused = ref(false)

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

onBeforeUnmount(() => {
  if (isRecording.value && mediaRecorder.value) {
    mediaRecorder.value.stop()
  }

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }

  audioCleanup.forEach(dispose => dispose())
  audioCleanup.clear()
  audioRefs.clear()

  audioCleanup.forEach(dispose => dispose())
  audioCleanup.clear()
  audioRefs.clear()
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
const handleSendMessage = async () => {
  if (!selectedConversation.value || !activeConversation.value) return
  const hasText = !!messageInput.value.trim()
  const hasFiles = pendingFiles.value.length > 0
  if (!hasText && !hasFiles) return

  if (hasFiles) {
    isUploading.value = true
    try {
      await sendAttachments(selectedConversation.value, pendingFiles.value, activeConversation.value.userId, true)
      pendingFiles.value = []
    } finally {
      isUploading.value = false
    }
  }

  if (hasText) {
    sendMessage(selectedConversation.value, messageInput.value, activeConversation.value.userId, true)
    messageInput.value = ''
  }

  scrollToBottom()
}

const handleFilesAdded = (fileList: FileList | File[]) => {
  if (!fileList?.length) return
  const allowed = Array.from(fileList).filter((file) => {
    const name = file.name?.toLowerCase() || ''
    const type = file.type?.toLowerCase() || ''
    const isImage = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)
    const isVoice = type.startsWith('audio/') || name.endsWith('.webm') || name.endsWith('.ogg')
    return isImage || isVoice
  })
  pendingFiles.value = [...pendingFiles.value, ...allowed]
}

const onFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target?.files?.length) {
    handleFilesAdded(target.files)
    target.value = ''
  }
}

const onDropFiles = (event: DragEvent) => {
  event.preventDefault()
  dragActive.value = false
  if (event.dataTransfer?.files?.length) {
    handleFilesAdded(event.dataTransfer.files)
  }
}

const removePendingFile = (index: number) => {
  pendingFiles.value.splice(index, 1)
}

const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

const waveformBars = [6, 12, 9, 14, 10, 16, 11, 8, 13, 9, 12, 15, 7, 10, 6]
const progressRatio = (id: string) => {
  const state = audioState[id]
  if (!state?.duration) return 0
  return Math.min(1, Math.max(0, state.current / state.duration))
}
const progressPercent = (id: string) => progressRatio(id) * 100
const waveformPalette = (isBright: boolean) => isBright
  ? { fill: '#ffffff', base: 'rgba(255,255,255,0.38)' }
  : { fill: '#0f172a', base: 'rgba(15,23,42,0.28)' }
const barColor = (id: string, idx: number, isBright: boolean) => {
  const ratio = progressRatio(id)
  const threshold = (idx + 1) / waveformBars.length
  const { fill, base } = waveformPalette(isBright)
  return ratio >= threshold ? fill : base
}

const audioState = reactive<Record<string, { duration: number, current: number, playing: boolean, ready: boolean }>>({})
const audioRefs = new Map<string, HTMLAudioElement>()
const audioCleanup = new Map<string, () => void>()

const cleanupAudio = (id: string) => {
  const dispose = audioCleanup.get(id)
  if (dispose) {
    dispose()
    audioCleanup.delete(id)
  }
  audioRefs.delete(id)
}

const registerAudio = (el: HTMLAudioElement | null, id: string) => {
  cleanupAudio(id)
  if (!el) return

  const state = audioState[id] ?? (audioState[id] = { duration: 0, current: 0, playing: false, ready: false })
  const onLoaded = () => {
    state.duration = Number.isFinite(el.duration) ? el.duration : 0
    state.ready = true
  }
  const onTime = () => {
    state.current = el.currentTime
  }
  const onPlay = () => {
    state.playing = true
  }
  const onPause = () => {
    state.playing = false
  }
  const onEnded = () => {
    state.playing = false
    state.current = state.duration
  }

  el.addEventListener('loadedmetadata', onLoaded)
  el.addEventListener('timeupdate', onTime)
  el.addEventListener('play', onPlay)
  el.addEventListener('pause', onPause)
  el.addEventListener('ended', onEnded)

  audioRefs.set(id, el)
  audioCleanup.set(id, () => {
    el.removeEventListener('loadedmetadata', onLoaded)
    el.removeEventListener('timeupdate', onTime)
    el.removeEventListener('play', onPlay)
    el.removeEventListener('pause', onPause)
    el.removeEventListener('ended', onEnded)
  })
}

const toggleAudio = (id: string) => {
  const target = audioRefs.get(id)
  if (!target) return

  audioRefs.forEach((audio, key) => {
    if (key !== id) audio.pause()
  })

  if (target.paused) {
    target.play().catch(() => { /* noop */ })
  } else {
    target.pause()
  }
}

const seekAudio = (id: string, value: number) => {
  const audio = audioRefs.get(id)
  const state = audioState[id]
  if (!audio || !state?.duration) return
  const clamped = Math.min(Math.max(value, 0), state.duration)
  audio.currentTime = clamped
  state.current = clamped
}

const handleWaveSeek = (id: string, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement | null
  const state = audioState[id]
  if (!target || !state?.duration) return
  const rect = target.getBoundingClientRect()
  const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0
  const clampedRatio = Math.min(Math.max(ratio, 0), 1)
  seekAudio(id, clampedRatio * state.duration)
}

const startRecording = async () => {
  if (isRecording.value) return
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  mediaRecorder.value = recorder
  recordedChunks.length = 0
  isRecording.value = true
  isPaused.value = false
  accumulatedMs.value = 0
  recordingDurationMs.value = 0

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data)
  }

  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'audio/webm' })
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
    handleFilesAdded([file])
    stream.getTracks().forEach(t => t.stop())
    clearTimer()
    isRecording.value = false
    isPaused.value = false
  }

  recorder.start()
  startTimer()
}

const stopRecording = () => {
  if (!isRecording.value) return
  mediaRecorder.value?.stop()
}

const togglePauseRecording = () => {
  if (!mediaRecorder.value) return
  if (mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.pause()
    isPaused.value = true
    pauseTimer()
  } else if (mediaRecorder.value.state === 'paused') {
    mediaRecorder.value.resume()
    isPaused.value = false
    resumeTimer()
  }
}

const cancelRecording = () => {
  if (!mediaRecorder.value) return
  mediaRecorder.value.onstop = null
  mediaRecorder.value.stop()
  recordedChunks.length = 0
  clearTimer()
  isRecording.value = false
  isPaused.value = false
}

const startTimer = () => {
  const start = Date.now()
  recordingTimer.value = setInterval(() => {
    recordingDurationMs.value = accumulatedMs.value + (Date.now() - start)
  }, 200)
}

const pauseTimer = () => {
  accumulatedMs.value = recordingDurationMs.value
  if (recordingTimer.value) clearInterval(recordingTimer.value)
  recordingTimer.value = null
}

const resumeTimer = () => {
  const start = Date.now()
  recordingTimer.value = setInterval(() => {
    recordingDurationMs.value = accumulatedMs.value + (Date.now() - start)
  }, 200)
}

const formatRecordingTime = computed(() => {
  const totalSeconds = Math.floor(recordingDurationMs.value / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

const clearTimer = () => {
  if (recordingTimer.value) clearInterval(recordingTimer.value)
  recordingTimer.value = null
  recordingDurationMs.value = 0
  accumulatedMs.value = 0
}

const createObjectUrl = (file: File) => URL.createObjectURL(file)

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

const extractLinks = (text: string) => text.match(/https?:\/\/\S+/g) || []
const isAudioLink = (link: string) => /\.(mp3|wav|m4a|ogg|webm)$/i.test(link.split('?')[0] || '')
const isImageLink = (link: string) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(link.split('?')[0] || '')
const isSoloLink = (text: string) => {
  const links = extractLinks(text)
  return links.length === 1 && text.trim() === links[0]
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
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 relative"
            @dragover.prevent="dragActive = true"
            @dragleave.prevent="dragActive = false"
            @drop.prevent="onDropFiles"
          >
            <div
              v-if="dragActive"
              class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            >
              <div class="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/70 px-6 py-4 text-primary-800 shadow-lg">
                Drop images or voice note to attach
              </div>
            </div>
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.isFromAdmin ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[90%] rounded-lg px-4 py-2 overflow-hidden break-words break-all"
                :class="message.isFromAdmin
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'"
              >
                <template v-if="isSoloLink(message.content) && isImageLink(extractLinks(message.content)[0] || '')">
                  <img
                    :src="extractLinks(message.content)[0] || ''"
                    alt="Image attachment"
                    class="rounded-md max-h-64 object-contain"
                    loading="lazy"
                  >
                </template>
                <template v-else-if="isSoloLink(message.content) && isAudioLink(extractLinks(message.content)[0] || '')">
                  <div class="bg-white/10 dark:bg-black/20 border border-white/15 rounded-lg px-3 py-2 flex items-center gap-4">
                    <audio
                      :ref="(el) => registerAudio(el as HTMLAudioElement | null, message.id)"
                      :src="extractLinks(message.content)[0] || ''"
                      preload="metadata"
                      class="hidden"
                    />
                    <button
                      type="button"
                      class="size-10 rounded-full border border-white/40 bg-white/20 text-white flex items-center justify-center shadow-sm transition hover:bg-white/30 hover:border-white/50"
                      @click="toggleAudio(message.id)"
                    >
                      <UIcon :name="audioState[message.id]?.playing ? 'i-lucide-pause' : 'i-lucide-play'" class="size-4" />
                    </button>
                    <div class="flex-1 flex flex-col gap-1.5">
                      <div
                        class="relative flex items-end gap-0.5 h-10 overflow-hidden cursor-pointer"
                        @click="handleWaveSeek(message.id, $event)"
                      >
                        <div
                          v-for="(h, idx) in waveformBars"
                          :key="idx"
                          class="flex-1 rounded-full transition-colors duration-150"
                          :style="{ height: `${h}px`, background: barColor(message.id, idx, message.isFromAdmin) }"
                        />
                        <div
                          class="pointer-events-none absolute inset-y-0 left-0 rounded-xl"
                          :style="{ width: `${progressPercent(message.id)}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))' }"
                        />
                      </div>
                      <div class="flex items-center justify-between text-[11px] opacity-85 font-mono">
                        <span>{{ formatAudioTime(audioState[message.id]?.current || 0) }}</span>
                        <span>{{ formatAudioTime(audioState[message.id]?.duration || 0) }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <p class="text-sm break-words break-all whitespace-pre-wrap">
                    {{ message.content }}
                  </p>
                  <div v-if="extractLinks(message.content).length" class="mt-2 space-y-1">
                    <div
                      v-for="link in extractLinks(message.content)"
                      :key="link"
                      class="text-xs"
                    >
                      <a
                        :href="link"
                        target="_blank"
                        rel="noreferrer"
                        class="underline break-words"
                      >
                        {{ link }}
                      </a>
                    </div>
                  </div>
                </template>
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
          <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <div v-if="pendingFiles.length" class="flex flex-wrap gap-3">
              <div
                v-for="(file, idx) in pendingFiles"
                :key="idx"
                class="relative rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900/50"
              >
                <button
                  class="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full shadow p-1"
                  type="button"
                  aria-label="Remove attachment"
                  @click="removePendingFile(idx)"
                >
                  <UIcon name="i-lucide-x" class="size-3" />
                </button>
                <template v-if="file.type.startsWith('image/')">
                  <img :src="createObjectUrl(file)" alt="attachment" class="h-24 w-24 object-cover rounded">
                </template>
                <template v-else>
                  <div class="flex items-center gap-2 text-sm">
                    <UIcon name="i-lucide-mic" class="size-4" />
                    <span class="truncate max-w-[140px]">{{ file.name }}</span>
                  </div>
                </template>
              </div>
            </div>

            <div v-if="isRecording" class="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 flex items-center gap-3">
              <div class="flex items-center gap-2 text-primary-900">
                <UIcon name="i-lucide-mic" class="size-5" />
                <div class="flex gap-1 h-6 items-end">
                  <span
                    v-for="n in 8"
                    :key="n"
                    class="w-1 rounded bg-primary-600 animate-pulse"
                    :style="{ animationDelay: `${n * 60}ms`, height: `${8 + (n % 3) * 4}px` }"
                  />
                </div>
                <span class="font-mono text-sm">{{ formatRecordingTime }}</span>
              </div>
              <div class="flex items-center gap-2 ml-auto">
                <UButton
                  size="xs"
                  color="orange"
                  variant="soft"
                  :icon="isPaused ? 'i-lucide-play' : 'i-lucide-pause'"
                  @click="togglePauseRecording"
                />
                <UButton
                  size="xs"
                  color="red"
                  variant="soft"
                  icon="i-lucide-trash"
                  @click="cancelRecording"
                />
                <UButton
                  size="xs"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-square"
                  @click="stopRecording"
                />
              </div>
            </div>

            <form class="flex gap-2 items-center" @submit.prevent="handleSendMessage">
              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="onFileInput"
              >
              <UButton
                type="button"
                icon="i-lucide-paperclip"
                color="gray"
                variant="soft"
                :loading="isUploading"
                @click="fileInput?.click()"
              />
              <UButton
                type="button"
                :icon="isRecording ? 'i-lucide-square' : 'i-lucide-mic'"
                color="orange"
                variant="soft"
                :loading="isUploading"
                @click="isRecording ? stopRecording() : startRecording()"
              />
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
                :disabled="(!messageInput.trim() && !pendingFiles.length) || isUploading"
              >
                Send
              </UButton>
            </form>
            <p v-if="isUploading" class="text-xs text-gray-500 mt-2">
              Uploading attachments...
            </p>
            <p v-if="isRecording" class="text-xs text-orange-600 mt-1">
              Recording... tap mic to stop
            </p>
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
