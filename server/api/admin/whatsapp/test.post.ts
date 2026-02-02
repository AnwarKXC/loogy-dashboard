import { sendWhatsAppMessage, isConnected } from '~~/server/utils/whatsapp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, message } = body

  if (!phone) {
    throw createError({
      statusCode: 400,
      message: 'Phone number is required'
    })
  }

  if (!isConnected()) {
    throw createError({
      statusCode: 400,
      message: 'WhatsApp is not connected'
    })
  }

  const testMessage = message || '🧪 رسالة تجريبية من لوحة التحكم\n\nThis is a test message from the dashboard.'

  const result = await sendWhatsAppMessage(phone, testMessage)

  if (!result.success) {
    throw createError({
      statusCode: 500,
      message: result.error || 'Failed to send message'
    })
  }

  return { success: true, message: 'Test message sent successfully' }
})
