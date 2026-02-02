import { defineEventHandler, createError } from 'h3'
import { initializeWhatsApp, getConnectionStatus } from '../../utils/whatsapp'

export default defineEventHandler(async () => {
  const currentStatus = getConnectionStatus()

  if (currentStatus === 'connected') {
    return {
      success: true,
      status: 'connected',
      message: 'Already connected'
    }
  }

  if (currentStatus === 'connecting') {
    return {
      success: true,
      status: 'connecting',
      message: 'Connection in progress'
    }
  }

  const result = await initializeWhatsApp()

  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error || 'Failed to connect WhatsApp'
    })
  }

  return {
    success: true,
    status: getConnectionStatus(),
    message: 'WhatsApp connection initiated'
  }
})
