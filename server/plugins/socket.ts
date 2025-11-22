import type { Nitro } from 'nitropack'
import type { Server as HttpServer } from 'http'
import { initializeSocketServer } from '../sockets/chat.gateway'

export default defineNitroPlugin((nitroApp: Nitro) => {
  // Get the Node server instance
  const httpServer = nitroApp.h3App.websocket?.server as unknown as HttpServer

  if (!httpServer) {
    console.warn('HTTP server not available for Socket.io initialization')
    return
  }

  // Initialize Socket.io server
  try {
    const io = initializeSocketServer(httpServer)
    console.log('✅ Socket.io server initialized successfully')

    // Store io instance in nitro context for potential use in API routes
    nitroApp.hooks.hook('request', (event) => {
      event.context.io = io
    })
  } catch (error) {
    console.error('❌ Failed to initialize Socket.io:', error)
  }
})
