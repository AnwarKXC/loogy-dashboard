import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket = io(config.public.socketUrl, {
    autoConnect: true
  })

  return {
    provide: {
      socket
    }
  }
})
