import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

interface ChatMessage {
  id: string
  conversationId: string
  userId: number | null
  content: string
  isFromAdmin: boolean
  status: 'SENT' | 'DELIVERED' | 'SEEN'
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name: string
    email: string
  }
}

interface Conversation {
  id: string
  userId: number
  user: {
    id: number
    name: string
    email: string
    phoneNumber?: string | null
  }
  lastMessageAt: string
  lastMessageContent?: string | null
  unreadCount: number
  isActive: boolean
  messages: ChatMessage[]
}

interface TypingState {
  conversationId: string
  userId: number
  isAdmin: boolean
}

export const useChat = () => {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const currentConversation = ref<Conversation | null>(null)
  const conversations = ref<Conversation[]>([])
  const messages = ref<ChatMessage[]>([])
  const typingUsers = ref<Map<string, boolean>>(new Map())
  const isTyping = ref(false)

  let typingTimeout: NodeJS.Timeout | null = null

  const connect = (userId: number, isAdmin: boolean = false) => {
    const config = useRuntimeConfig()
    const socketUrl = config.public.socketUrl || 'http://localhost:3000'

    socket.value = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.value.on('connect', () => {
      connected.value = true
      console.log('✅ Connected to chat server')
      socket.value?.emit('join', { userId, isAdmin })
    })

    socket.value.on('disconnect', () => {
      connected.value = false
      console.log('❌ Disconnected from chat server')
    })

    socket.value.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    // Admin receives all conversations
    socket.value.on('conversations:list', (data: Conversation[]) => {
      conversations.value = data
    })

    // User receives their conversation
    socket.value.on('conversation:joined', (data: Conversation) => {
      currentConversation.value = data
      messages.value = data.messages || []
    })

    // New message received
    socket.value.on('message:new', (message: ChatMessage) => {
      messages.value.push(message)

      // Update conversation last message
      if (isAdmin && conversations.value.length > 0) {
        const conv = conversations.value.find(c => c.id === message.conversationId)
        if (conv) {
          conv.lastMessageContent = message.content
          conv.lastMessageAt = message.createdAt
          if (!message.isFromAdmin) {
            conv.unreadCount++
          }
        }
      }

      // Play notification sound (optional)
      if (message.isFromAdmin !== isAdmin) {
        playNotificationSound()
      }
    })

    // Message delivered
    socket.value.on('message:delivered', ({ messageId, status }) => {
      const msg = messages.value.find(m => m.id === messageId)
      if (msg) {
        msg.status = status
      }
    })

    // Message status updated
    socket.value.on('message:status:updated', ({ messageId, status }) => {
      const msg = messages.value.find(m => m.id === messageId)
      if (msg) {
        msg.status = status === 'delivered' ? 'DELIVERED' : 'SEEN'
      }
    })

    // Typing indicators
    socket.value.on('typing:start', ({ conversationId, userId: typingUserId, isAdmin: typingIsAdmin }) => {
      const key = `${conversationId}-${typingUserId}-${typingIsAdmin}`
      typingUsers.value.set(key, true)
      isTyping.value = true
    })

    socket.value.on('typing:stop', ({ conversationId, userId: typingUserId, isAdmin: typingIsAdmin }) => {
      const key = `${conversationId}-${typingUserId}-${typingIsAdmin}`
      typingUsers.value.delete(key)
      isTyping.value = typingUsers.value.size > 0
    })

    // Conversation seen
    socket.value.on('conversation:seen', ({ conversationId }) => {
      if (isAdmin) {
        const conv = conversations.value.find(c => c.id === conversationId)
        if (conv) {
          conv.unreadCount = 0
        }
      }
    })

    // Error handling
    socket.value.on('error', ({ message }) => {
      console.error('Chat error:', message)
      // You can show a toast notification here
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  const sendMessage = (conversationId: string, content: string, userId: number, isAdmin: boolean = false) => {
    if (!socket.value || !connected.value) {
      console.error('Socket not connected')
      return
    }

    socket.value.emit('message:send', {
      conversationId,
      userId,
      content,
      isFromAdmin: isAdmin
    })

    // Stop typing when sending
    stopTyping(conversationId, userId, isAdmin)
  }

  const startTyping = (conversationId: string, userId: number, isAdmin: boolean = false) => {
    if (!socket.value || !connected.value) return

    socket.value.emit('typing:start', {
      conversationId,
      userId,
      isAdmin
    })

    // Auto-stop typing after 3 seconds of inactivity
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      stopTyping(conversationId, userId, isAdmin)
    }, 3000)
  }

  const stopTyping = (conversationId: string, userId: number, isAdmin: boolean = false) => {
    if (!socket.value || !connected.value) return

    socket.value.emit('typing:stop', {
      conversationId,
      userId,
      isAdmin
    })

    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
  }

  const markAsDelivered = (messageId: string) => {
    if (!socket.value || !connected.value) return

    socket.value.emit('message:status', {
      messageId,
      status: 'delivered'
    })
  }

  const markAsSeen = (messageId: string) => {
    if (!socket.value || !connected.value) return

    socket.value.emit('message:status', {
      messageId,
      status: 'seen'
    })
  }

  const openConversation = (conversationId: string, userId: number, isAdmin: boolean = false) => {
    if (!socket.value || !connected.value) return

    socket.value.emit('conversation:opened', {
      conversationId,
      userId,
      isAdmin
    })

    // Mark all messages as seen
    messages.value
      .filter(m => m.status !== 'SEEN' && m.isFromAdmin !== isAdmin)
      .forEach(m => markAsSeen(m.id))
  }

  const playNotificationSound = () => {
    // Optional: Play notification sound
    if (import.meta.client) {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // User hasn't interacted with page yet
      })
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
  })

  return {
    // State
    socket,
    connected,
    currentConversation,
    conversations,
    messages,
    isTyping,
    typingUsers,

    // Methods
    connect,
    disconnect,
    sendMessage,
    startTyping,
    stopTyping,
    markAsDelivered,
    markAsSeen,
    openConversation
  }
}
