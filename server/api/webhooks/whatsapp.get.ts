import { getIO } from '../../sockets/chat.gateway'

export default eventHandler((event) => {
  const query = getQuery(event)

  // Verify token from environment variables
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'loogy_dashboard_verify_token'

  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp Webhook Verified')
      return parseInt(challenge as string)
    } else {
      throw createError({
        statusCode: 403,
        statusMessage: 'Verification failed'
      })
    }
  }

  return { status: 'ok' }
})
