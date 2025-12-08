import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // Log the client socket URL once to confirm which endpoint is used
  // This runs only on the client (plugin suffix .client)

  console.log('[socket.io][client] using socketUrl', config.public.socketUrl)
  const socket = io(config.public.socketUrl, {
    autoConnect: true
  })

  return {
    provide: {
      socket
    }
  }
})
