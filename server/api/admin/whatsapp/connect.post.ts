import { initializeWhatsApp, getConnectionStatus } from '~~/server/utils/whatsapp'

export default defineEventHandler(async () => {
  const status = getConnectionStatus()

  // If already connecting or connected, return current status
  if (status === 'connecting') {
    return { success: true, message: 'Connection already in progress' }
  }
  if (status === 'connected') {
    return { success: true, message: 'Already connected' }
  }

  // Start initialization in the background (don't await)
  initializeWhatsApp().catch((error) => {
    console.error('WhatsApp initialization error:', error)
  })

  // Return immediately
  return { success: true, message: 'Connection initiated, please wait for QR code' }
})
