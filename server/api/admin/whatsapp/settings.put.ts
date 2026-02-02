import { updateWhatsAppSettings } from '~~/server/utils/whatsapp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const settings = await updateWhatsAppSettings({
    isEnabled: body.isEnabled,
    recipientPhone: body.recipientPhone,
    businessNotificationNumber: body.businessNotificationNumber,
    autoReconnect: body.autoReconnect,
    sendToCustomer: body.sendToCustomer,
    sendToBusiness: body.sendToBusiness
  })

  return settings
})
