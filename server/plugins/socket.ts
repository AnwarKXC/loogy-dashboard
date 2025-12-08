import type { Nitro } from 'nitropack'
import { createServer } from 'http'
import type { Server as HttpServer } from 'http'
import { initializeSocketServer } from '../sockets/chat.gateway'

export default defineNitroPlugin((nitroApp: Nitro) => {
  const isInitialized = () => Boolean((nitroApp as any)._socketInitialized)

  const findServer = () => {
    const h3App = nitroApp.h3App as any
    return h3App?.nodeHandler?.server
      || h3App?.server?.nodeServer
      || h3App?.server
      || h3App?.nodeHandler
      || (nitroApp as any)?.node?.server
      || (nitroApp as any)?.server?.node?.server
      || (nitroApp as any)?.server?.server
      || (nitroApp as any)?.server
  }

  const logProbeState = (label: string) => {
    const h3App = nitroApp.h3App as any
    console.log(`[socket.io] ${label}`, {
      hasH3App: Boolean(h3App),
      hasNodeHandlerServer: Boolean(h3App?.nodeHandler?.server),
      hasH3Server: Boolean(h3App?.server),
      hasH3ServerNodeServer: Boolean(h3App?.server?.nodeServer),
      hasH3NodeHandler: Boolean(h3App?.nodeHandler),
      hasNitroNodeServer: Boolean((nitroApp as any)?.node?.server),
      hasNitroServerNodeServer: Boolean((nitroApp as any)?.server?.node?.server),
      hasNitroServerServer: Boolean((nitroApp as any)?.server?.server),
      hasNitroServer: Boolean((nitroApp as any)?.server)
    })
  }

  const tryInitialize = (httpServer: HttpServer | null | undefined, source: string) => {
    console.log(`[socket.io] init attempt from ${source}`, {
      alreadyInitialized: isInitialized(),
      hasServer: Boolean(httpServer)
    })

    if (isInitialized() || !httpServer) return

    try {
      const io = initializeSocketServer(httpServer)
      // @ts-expect-error runtime flag
      ;(nitroApp as any)._socketInitialized = true
      console.log(`✅ Socket.io server initialized successfully (${source})`)

      nitroApp.hooks.hook('request', (event) => {
        event.context.io = io
      })
    } catch (error) {
      console.error(`❌ Failed to initialize Socket.io (${source}):`, error)
    }
  }

  // Prefer to initialize once the server is actually listening to ensure the HTTP server exists
  nitroApp.hooks.hookOnce('listen', (listener) => {
    logProbeState('listen hook fired')
    const httpServer = (listener as any)?.server as HttpServer | undefined
    tryInitialize(httpServer || findServer(), 'listen')
  })

  // Poll for late availability of the HTTP server (some adapters expose it after boot)
  let attempts = 0
  const poll = setInterval(() => {
    if (isInitialized()) {
      clearInterval(poll)
      return
    }

    const server = findServer()
    const h3App = nitroApp.h3App as any
    console.log('[socket.io] poll probe', {
      attempt: attempts + 1,
      hasServer: Boolean(server),
      hasNodeHandlerServer: Boolean(h3App?.nodeHandler?.server),
      hasH3Server: Boolean(h3App?.server),
      hasH3ServerNodeServer: Boolean(h3App?.server?.nodeServer),
      hasH3NodeHandler: Boolean(h3App?.nodeHandler),
      hasNitroNodeServer: Boolean((nitroApp as any)?.node?.server),
      hasNitroServerNodeServer: Boolean((nitroApp as any)?.server?.node?.server),
      hasNitroServerServer: Boolean((nitroApp as any)?.server?.server),
      hasNitroServer: Boolean((nitroApp as any)?.server)
    })

    if (server) {
      tryInitialize(server as HttpServer, 'poll')
      clearInterval(poll)
    }

    if (++attempts >= 10) {
      console.warn('[socket.io] poll exhausted without finding HTTP server')

      // Fallback: spin up a dedicated Socket.io HTTP server if Nitro does not expose one (common in dev adapters)
      const fallbackPort = Number(process.env.SOCKET_IO_PORT || process.env.PORT || 4001)
      if (!isInitialized()) {
        try {
          const fallbackServer = createServer()
          tryInitialize(fallbackServer as HttpServer, 'fallback-http')
          fallbackServer.listen(fallbackPort, () => {
            console.warn(`⚠️ Socket.io running on fallback port ${fallbackPort}. Set NUXT_PUBLIC_SOCKET_URL=http://localhost:${fallbackPort} in .env for the client.`)
          })
        } catch (error) {
          console.error('❌ Failed to start fallback Socket.io HTTP server', error)
        }
      }
      clearInterval(poll)
    }
  }, 500)

  nitroApp.hooks.hookOnce('close', () => clearInterval(poll))

  // Also attempt immediate initialization for adapters that expose the server early (useful in dev/hot reload)
  logProbeState('immediate init probe')
  tryInitialize(findServer() as HttpServer | undefined, 'immediate')
})
