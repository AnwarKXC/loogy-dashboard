import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { updateWhatsAppSettings } from '../../utils/whatsapp'

const updateSchema = z.object({
  isEnabled: z.boolean().optional(),
  recipientPhone: z.string().nullable().optional(),
  businessNotificationNumber: z.string().nullable().optional(),
  autoReconnect: z.boolean().optional(),
  sendToCustomer: z.boolean().optional(),
  sendToBusiness: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.flatten()
    })
  }

  const updated = await updateWhatsAppSettings(result.data)

  return {
    success: true,
    settings: {
      id: updated.id,
      isEnabled: updated.isEnabled,
      connectionStatus: updated.connectionStatus,
      recipientPhone: updated.recipientPhone,
      businessNotificationNumber: updated.businessNotificationNumber,
      autoReconnect: updated.autoReconnect,
      sendToCustomer: updated.sendToCustomer,
      sendToBusiness: updated.sendToBusiness
    }
  }
})
