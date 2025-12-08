// @ts-nocheck
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

/* eslint-disable @typescript-eslint/no-explicit-any */
// Global composables (Nuxt auto-imported at runtime; declared here for type tools)
declare const useToast: any
declare const useSessionUser: any
declare const usePushNotifications: any
declare const useCookie: any
declare const useState: any
declare const useChat: any

const toast = useToast()
const user = useSessionUser()
const { subscribe: subscribeToPush } = usePushNotifications()

// Use cookie to persist guest user across page reloads
const guestUserCookie = useCookie('chat-guest-user', {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: 'lax'
})

const guestUser = useState('chat-guest-user', () => guestUserCookie.value)
const isStartingGuest = ref(false)
const guestForm = reactive({
  name: '',
  phoneNumber: ''
})

const {
  connect,
  connected,
  currentConversation,
  messages: chatMessages,
  isTyping,
  sendMessage,
  sendAttachments,
  startTyping,
  stopTyping,
  openConversation
} = useChat()

const isOpen = ref(false)
const inputValue = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const unreadCount = ref(0)
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

const chatIdentity = computed(() => user.value ?? guestUser.value)
const hasChatIdentity = computed(() => !!chatIdentity.value)

const sortedMessages = computed(() =>
  [...chatMessages.value].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
)

const conversationId = computed(() => currentConversation.value?.id ?? null)

const toggleWidget = () => {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    ensureConnected()
    markConversationOpened()
    unreadCount.value = 0
    scrollToBottom()
  }
}

const ensureConnected = async () => {
  if (!hasChatIdentity.value) return

  if (!connected.value && chatIdentity.value) {
    await connect(chatIdentity.value.id, false)
  }
}

const startGuestChat = async () => {
  if (isStartingGuest.value) return

  if (!guestForm.name.trim()) {
    toast.add({
      title: 'Name required',
      description: 'Please share your name.',
      color: 'warning',
      icon: 'i-lucide-user'
    })
    return
  }

  if (!guestForm.phoneNumber.trim()) {
    toast.add({
      title: 'Phone required',
      description: 'We need your WhatsApp number to reach you back.',
      color: 'warning',
      icon: 'i-lucide-phone'
    })
    return
  }

  isStartingGuest.value = true
  try {
    const response = await $fetch<{ user: { id: number, name: string | null, phoneNumber: string | null, email: string }, conversationId: string }>('/api/chat/start', {
      method: 'POST',
      body: {
        name: guestForm.name,
        phoneNumber: guestForm.phoneNumber
      }
    })

    guestUser.value = response.user
    guestUserCookie.value = response.user // Persist to cookie
    // Enable web push notifications for guest chat replies
    await subscribeToPush()
    // Connect to socket with the new user ID
    await ensureConnected()
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Could not start chat',
      description: 'Please try again with a different number.',
      color: 'error',
      icon: 'i-lucide-alert-triangle'
    })
  } finally {
    isStartingGuest.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  const el = messageListRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

const markConversationOpened = () => {
  if (conversationId.value && chatIdentity.value) {
    openConversation(conversationId.value, chatIdentity.value.id, false)
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const extractLinks = (text: string) => text.match(/https?:\/\/\S+/g) || []
const isAudioLink = (link: string) => /\.(mp3|wav|m4a|ogg|webm)$/i.test(link.split('?')[0] || '')
const isImageLink = (link: string) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(link.split('?')[0] || '')
const isSoloLink = (text: string) => {
  const links = extractLinks(text)
  return links.length === 1 && text.trim() === links[0]
}

const handleSend = async () => {
  if (!chatIdentity.value) {
    toast.add({
      title: 'Start the chat first',
      description: 'Share your name and WhatsApp number.',
      color: 'warning',
      icon: 'i-lucide-phone'
    })
    return
  }

  const trimmed = inputValue.value.trim()
  const hasText = !!trimmed
  const hasFiles = pendingFiles.value.length > 0
  if (!hasText && !hasFiles) return

  if (hasFiles && conversationId.value) {
    isUploading.value = true
    try {
      await sendAttachments(conversationId.value, pendingFiles.value, chatIdentity.value.id, false)
      pendingFiles.value = []
    } finally {
      isUploading.value = false
    }
  }

  if (hasText && conversationId.value) {
    sendMessage(conversationId.value, trimmed, chatIdentity.value.id, false)
    inputValue.value = ''
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

const clearTimer = () => {
  if (recordingTimer.value) clearInterval(recordingTimer.value)
  recordingTimer.value = null
  recordingDurationMs.value = 0
  accumulatedMs.value = 0
}

const formatRecordingTime = computed(() => {
  const totalSeconds = Math.floor(recordingDurationMs.value / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

const createObjectUrl = (file: File) => URL.createObjectURL(file)

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
  ? { fill: '#ffffff', base: 'rgba(255,255,255,0.35)' }
  : { fill: '#ea580c', base: 'rgba(234,88,12,0.25)' }
const barColor = (id: string, idx: number, isBright: boolean) => {
  const ratio = progressRatio(id)
  const threshold = (idx + 1) / waveformBars.length
  const { fill, base } = waveformPalette(isBright)
  return ratio >= threshold ? fill : base
}

const audioState: Record<string, any> = reactive({}) as Record<string, any>
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

const toggleIcon = computed(() => isOpen.value ? 'i-lucide-x' : 'i-lucide-message-circle')

const onInput = () => {
  if (conversationId.value && chatIdentity.value) {
    startTyping(conversationId.value, chatIdentity.value.id, false)
  }
}

watch(() => chatMessages.value.length, () => {
  if (isOpen.value) {
    scrollToBottom()
  } else {
    const last = sortedMessages.value[sortedMessages.value.length - 1]
    if (last && last.isFromAdmin) {
      unreadCount.value += 1
    }
  }
})

watch(conversationId, (id) => {
  if (isOpen.value && id && chatIdentity.value) {
    openConversation(id, chatIdentity.value.id, false)
    scrollToBottom()
  }
})

onMounted(async () => {
  // Restore connection if guest user exists in cookie (from previous session)
  if (guestUser.value && !connected.value) {
    await ensureConnected()
  }
})

onBeforeUnmount(() => {
  if (conversationId.value && chatIdentity.value) {
    stopTyping(conversationId.value, chatIdentity.value.id, false)
  }

  if (isRecording.value && mediaRecorder.value) {
    mediaRecorder.value.stop()
  }

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }

  audioCleanup.forEach(dispose => dispose())
  audioCleanup.clear()
  audioRefs.clear()
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="fixed bottom-6 right-6 z-50">
        <!-- Chat trigger button with motion animation -->
        <div v-motion-pop class="inline-block">
          <UButton
            color="primary"
            size="lg"
            :icon="toggleIcon"
            class="h-16 w-16 rounded-full shadow-2xl hover:shadow-orange-500/50 hover:scale-110"
            square
            aria-label="Toggle chat widget"
            @click="toggleWidget"
          />
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 min-w-[22px] px-1.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg animate-pulse text-center"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>

        <Transition
          enter-active-class="motion-enter"
          enter-from-class="motion-enter-from"
          enter-to-class="motion-enter-to"
          leave-active-class="motion-leave"
          leave-from-class="motion-leave-from"
          leave-to-class="motion-leave-to"
        >
          <div
            v-if="isOpen"
            v-motion-slide-visible-once
            :initial="{ opacity: 0, y: 50, scale: 0.95 }"
            :visibleOnce="{ opacity: 1, y: 0, scale: 1 }"
            :transition="{ duration: 300, type: 'spring', bounce: 0.3 }"
            class="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <!-- Header -->
            <div class="bg-orange-500 text-white p-4 rounded-t-2xl">
              <h3 class="font-bold text-lg">
                Fawry Support
              </h3>
              <p class="text-sm text-orange-100">
                We typically reply in minutes
              </p>
            </div>

            <!-- Start chat form -->
            <div v-if="!hasChatIdentity" v-motion-fade class="p-4 border-b border-slate-200 bg-white space-y-3">
              <p class="text-sm text-slate-600">
                Start a chat with us. We'll reply on your WhatsApp number.
              </p>
              <div class="space-y-3">
                <UInput
                  v-model="guestForm.name"
                  placeholder="Your name"
                  class="bg-slate-50 border-slate-300"
                />
                <UInput
                  v-model="guestForm.phoneNumber"
                  placeholder="WhatsApp number"
                  type="tel"
                  class="bg-slate-50 border-slate-300"
                  required
                />
                <UButton
                  block
                  color="primary"
                  :loading="isStartingGuest"
                  :disabled="!guestForm.name.trim() || !guestForm.phoneNumber.trim()"
                  icon="i-lucide-message-circle"
                  class="bg-orange-500 hover:bg-orange-600 text-white"
                  @click="startGuestChat"
                >
                  Start chat
                </UButton>
              </div>
            </div>

            <!-- Messages area -->
            <div
              ref="messageListRef"
              class="h-80 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-white relative"
              @dragover.prevent="dragActive = true"
              @dragleave.prevent="dragActive = false"
              @drop.prevent="onDropFiles"
            >
              <div
                v-if="dragActive"
                class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              >
                <div class="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/80 px-4 py-2 text-orange-800 shadow">
                  Drop image or voice note to attach
                </div>
              </div>
              <TransitionGroup name="chat-message" tag="div" class="space-y-3">
                <div
                  v-for="message in sortedMessages"
                  :key="message.id"
                  v-motion-slide-visible-once
                  :initial="{ opacity: 0, x: message.isFromAdmin ? -20 : 20 }"
                  :visibleOnce="{ opacity: 1, x: 0 }"
                  :transition="{ duration: 200 }"
                  class="flex"
                  :class="message.isFromAdmin ? 'justify-start' : 'justify-end'"
                >
                  <div
                    class="max-w-[90%] rounded-xl px-4 py-2 text-sm break-words break-all whitespace-pre-wrap overflow-hidden"
                    :class="message.isFromAdmin
                      ? 'bg-slate-100 text-slate-900 rounded-bl-none'
                      : 'bg-orange-500 text-white rounded-br-none shadow-md'"
                  >
                    <template v-if="isSoloLink(message.content) && isImageLink(extractLinks(message.content)[0] || '')">
                      <img
                        :src="extractLinks(message.content)[0] || ''"
                        alt="Image attachment"
                        class="rounded-md max-h-56 object-contain"
                        loading="lazy"
                      >
                    </template>
                    <template v-else-if="isSoloLink(message.content) && isAudioLink(extractLinks(message.content)[0] || '')">
                      <div class="bg-white/15 rounded-md px-3 py-2 flex items-center gap-4" :class="message.isFromAdmin ? 'text-slate-900 border border-orange-100' : 'text-white border border-white/20'">
                        <audio
                          :ref="(el) => registerAudio(el as HTMLAudioElement | null, message.id)"
                          :src="extractLinks(message.content)[0] || ''"
                          preload="metadata"
                          class="hidden"
                        />
                        <button
                          type="button"
                          class="size-10 rounded-full flex items-center justify-center shadow-sm transition"
                          :class="message.isFromAdmin
                            ? 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'
                            : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                          "
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
                              :style="{ height: `${h}px`, background: barColor(message.id, idx, !message.isFromAdmin) }"
                            />
                            <div
                              class="pointer-events-none absolute inset-y-0 left-0 rounded-xl"
                              :style="{ width: `${progressPercent(message.id)}%`, background: message.isFromAdmin ? 'linear-gradient(90deg, rgba(234,88,12,0.15), rgba(234,88,12,0.05))' : 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))' }"
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
                      {{ message.content }}
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
                    <div class="flex items-center justify-between gap-2 mt-1 text-[11px] opacity-80">
                      <span>{{ formatTime(message.createdAt) }}</span>
                      <UIcon
                        v-if="!message.isFromAdmin"
                        :name="message.status === 'SEEN' ? 'i-lucide-check-check' : message.status === 'DELIVERED' ? 'i-lucide-check' : 'i-lucide-clock'"
                        class="size-3.5"
                        :class="message.status === 'SEEN' ? 'text-white' : 'opacity-80'"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="isTyping" key="typing-indicator" class="flex justify-start">
                  <div class="bg-slate-100 text-slate-900 rounded-xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                    <span class="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style="animation-delay: 150ms" />
                    <span class="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style="animation-delay: 300ms" />
                  </div>
                </div>
              </TransitionGroup>
            </div>

            <!-- Input area -->
            <div class="p-4 border-t border-slate-200 bg-white space-y-3">
              <div v-if="pendingFiles.length" class="flex flex-wrap gap-3">
                <div
                  v-for="(file, idx) in pendingFiles"
                  :key="idx"
                  class="relative rounded-lg border border-slate-200 bg-slate-50 p-2"
                >
                  <button
                    class="absolute -top-2 -right-2 bg-white rounded-full shadow p-1"
                    type="button"
                    aria-label="Remove attachment"
                    @click="removePendingFile(idx)"
                  >
                    <UIcon name="i-lucide-x" class="size-3" />
                  </button>
                  <template v-if="file.type.startsWith('image/')">
                    <img :src="createObjectUrl(file)" alt="attachment" class="h-20 w-20 object-cover rounded">
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-2 text-sm">
                      <UIcon name="i-lucide-mic" class="size-4" />
                      <span class="truncate max-w-[120px]">{{ file.name }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="isRecording" class="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-3">
                <div class="flex items-center gap-2 text-orange-900">
                  <UIcon name="i-lucide-mic" class="size-5" />
                  <div class="flex gap-1 h-6 items-end">
                    <span
                      v-for="n in 8"
                      :key="n"
                      class="w-1 rounded bg-orange-500 animate-pulse"
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

              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="onFileInput"
              >
              <div class="flex items-center gap-2">
                <UButton
                  color="gray"
                  variant="soft"
                  icon="i-lucide-paperclip"
                  :loading="isUploading"
                  :disabled="!hasChatIdentity"
                  @click="fileInput?.click()"
                />
                <UButton
                  color="orange"
                  variant="soft"
                  :icon="isRecording ? 'i-lucide-square' : 'i-lucide-mic'"
                  :loading="isUploading"
                  :disabled="!hasChatIdentity"
                  @click="isRecording ? stopRecording() : startRecording()"
                />
                <UInput
                  v-model="inputValue"
                  placeholder="Type a message..."
                  class="flex-1 bg-slate-50 border-slate-300"
                  :disabled="!hasChatIdentity"
                  @input="onInput"
                  @keyup.enter="handleSend"
                />
                <UButton
                  color="primary"
                  size="lg"
                  icon="i-lucide-send"
                  :disabled="(!inputValue.trim() && !pendingFiles.length) || isUploading || !hasChatIdentity"
                  @click="handleSend"
                >
                  Send
                </UButton>
              </div>
              <p v-if="!hasChatIdentity" class="text-xs text-slate-500 mt-2">
                Start the chat above to enable messaging.
              </p>
              <p v-if="isUploading" class="text-xs text-slate-500 mt-1">
                Uploading attachments...
              </p>
            </div>

            <!-- Close button -->
            <button
              class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chat"
              @click="toggleWidget"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5 text-white" />
            </button>
          </div>
        </Transition>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.motion-enter {
  animation: motion-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.motion-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.95);
}

.motion-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.motion-leave {
  animation: motion-slide-out 0.2s ease-in;
}

.motion-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.motion-leave-to {
  opacity: 0;
  transform: translateY(50px) scale(0.95);
}

@keyframes motion-slide-in {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes motion-slide-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
}

.chat-message-enter-active,
.chat-message-leave-active {
  transition: all 200ms ease;
}

.chat-message-enter-from,
.chat-message-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.chat-message-move {
  transition: transform 200ms ease;
}
</style>
