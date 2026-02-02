import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { sendWhatsAppMessage, isConnected } from '../../utils/whatsapp'

const sendSchema = z.object({
  phone: z.string().min(10),
  message: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  if (!isConnected()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'WhatsApp not connected'
    })
  }

  const body = await readBody(event)
  const result = sendSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.flatten()
    })
  }

  const { phone, message } = result.data
  const sendResult = await sendWhatsAppMessage(phone, message)

  if (!sendResult.success) {
    throw createError({
      statusCode: 500,
      statusMessage: sendResult.error || 'Failed to send message'
    })
  }

  return {
    success: true,
    message: 'Message sent successfully'
  }
})
