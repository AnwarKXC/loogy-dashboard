import { defineEventHandler } from 'h3'
import { disconnectWhatsApp } from '../../utils/whatsapp'

export default defineEventHandler(async () => {
  const result = await disconnectWhatsApp()

  return {
    success: result.success,
    status: 'disconnected',
    message: 'WhatsApp disconnected'
  }
})
