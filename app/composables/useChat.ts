import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

export interface ChatMessage {
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

export interface Conversation {
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

// Global state for singleton pattern
const socket = ref<Socket | null>(null)
const connected = ref(false)
const currentConversation = ref<Conversation | null>(null)
const conversations = ref<Conversation[]>([])
const messages = ref<ChatMessage[]>([])
const typingUsers = ref<Map<string, boolean>>(new Map())
const isTyping = ref(false)

interface UploadResponse {
  links: string[]
}

export const useChat = () => {
  let typingTimeout: NodeJS.Timeout | null = null

  const connect = (userId: number, isAdmin: boolean = false) => {
    return new Promise<void>((resolve, reject) => {
      // If already connected, just resolve
      if (connected.value && socket.value) {
        resolve()
        return
      }

      const config = useRuntimeConfig()
      const socketUrl = config.public.socketUrl || 'http://localhost:3000'

      socket.value = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      let resolved = false
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          reject(new Error('Connection timeout'))
        }
      }, 10000)

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
        console.error('❌ Connection error:', error)
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          reject(error)
        }
      })

      // For non-admins, resolve when conversation:joined is received
      // For admins, resolve when 'conversations:list' is received
      socket.value.on('conversation:joined', (data: Conversation) => {
        currentConversation.value = data
        messages.value = sortMessages(data.messages || [])
        if (!resolved && !isAdmin) {
          resolved = true
          clearTimeout(timeout)
          resolve()
        }
      })

      socket.value.on('conversations:list', (data: Conversation[]) => {
        conversations.value = data
        if (!resolved && isAdmin) {
          resolved = true
          clearTimeout(timeout)
          resolve()
        }
      })

      // Admin receives all conversations
      socket.value.on('conversations:list', (data: Conversation[]) => {
        conversations.value = data
      })

      // New message received
      socket.value.on('message:new', (message: any) => {
        // Normalize status casing so UI icons render correctly
        const rawStatus = message.status || (message.isFromAdmin ? 'DELIVERED' : 'SENT')
        const normalizedStatus = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : rawStatus
        message.status = normalizedStatus

        // Only add to messages if it belongs to current conversation
        if (currentConversation.value && currentConversation.value.id === message.conversationId) {
          // Remove optimistic temps that match this real message
          messages.value = messages.value.filter(m => !(m.id.startsWith('temp-') && m.isFromAdmin === message.isFromAdmin && m.content === message.content))

          if (!messages.value.some(m => m.id === message.id)) {
            messages.value.push(message)
            messages.value = sortMessages(messages.value)
          }
        }

        // Update conversation last message
        if (isAdmin) {
          let conv = conversations.value.find(c => c.id === message.conversationId)

          if (!conv && message.userName) {
            // Create new conversation entry for new user
            conv = {
              id: message.conversationId,
              userId: message.userId,
              user: {
                id: message.userId,
                name: message.userName,
                email: message.userEmail || '',
                phoneNumber: null
              },
              lastMessageAt: message.createdAt,
              lastMessageContent: message.content,
              unreadCount: 1,
              isActive: true,
              messages: [message]
            }
            conversations.value.unshift(conv)
          } else if (conv) {
            conv.lastMessageContent = message.content
            conv.lastMessageAt = message.createdAt
            if (!message.isFromAdmin) {
              conv.unreadCount++
            }

            // Move conversation to top
            const index = conversations.value.indexOf(conv)
            if (index > 0) {
              conversations.value.splice(index, 1)
              conversations.value.unshift(conv)
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
          msg.status = (status === 'delivered' ? 'DELIVERED' : status) as ChatMessage['status']
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
        console.error('❌ Chat error:', message)
      })
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
    if (!socket.value) {
      console.error('❌ Socket not initialized')
      return
    }

    if (!connected.value) {
      console.error('❌ Socket not connected, current state:', { connected: connected.value })
      return
    }

    console.log('📤 Sending message:', { conversationId, userId, content, isAdmin })
    socket.value.emit('message:send', {
      conversationId,
      userId,
      content,
      isFromAdmin: isAdmin
    })

    // Optimistic append; server will echo with real ID and status
    messages.value.push({
      id: `temp-${Date.now()}`,
      conversationId,
      userId: isAdmin ? null : userId,
      content,
      isFromAdmin: isAdmin,
      status: isAdmin ? 'DELIVERED' : 'SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any)
    messages.value = sortMessages(messages.value)

    // Stop typing when sending
    stopTyping(conversationId, userId, isAdmin)
  }

  const sendAttachments = async (conversationId: string, files: File[], userId: number, isAdmin: boolean = false) => {
    if (!files || files.length === 0) return []

    const allowed = files.filter((file) => {
      const name = file.name?.toLowerCase() || ''
      const type = file.type?.toLowerCase() || ''
      const isImage = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)
      const isVoice = type.startsWith('audio/') || name.endsWith('.webm') || name.endsWith('.ogg')
      return isImage || isVoice
    })

    if (!allowed.length) {
      console.warn('❌ No allowed files to upload (images or voice webm only)')
      return []
    }

    const formData = new FormData()
    formData.append('conversationId', conversationId)
    if (userId) {
      formData.append('userId', String(userId))
    }
    allowed.forEach(file => formData.append('files', file))

    let response: UploadResponse | null = null
    try {
      response = await $fetch<UploadResponse>('/api/chat/upload', {
        method: 'POST',
        body: formData
      })
    } catch (error) {
      console.error('❌ Failed to upload attachment:', error)
      return []
    }

    const links = response?.links || []
    for (const link of links) {
      // Send bare link; UI will render image/audio nicely
      sendMessage(conversationId, link, userId, isAdmin)
    }

    return links
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

    const conv = conversations.value.find(c => c.id === conversationId)
    if (conv) {
      currentConversation.value = conv
      messages.value = sortMessages(conv.messages || [])
    }

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
    sendAttachments,
    markAsDelivered,
    markAsSeen,
    openConversation
  }
}

function sortMessages(msgs: ChatMessage[]) {
  return [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
