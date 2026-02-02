import { defineEventHandler } from 'h3'
import {
  getWhatsAppSettings,
  getConnectionStatus,
  getCurrentQrCode
} from '../../utils/whatsapp'

export default defineEventHandler(async () => {
  const settings = await getWhatsAppSettings()

  return {
    id: settings.id,
    isEnabled: settings.isEnabled,
    connectionStatus: getConnectionStatus(),
    businessPhone: settings.businessPhone,
    recipientPhone: settings.recipientPhone,
    lastConnected: settings.lastConnected,
    qrCode: getCurrentQrCode() || settings.qrCode,
    autoReconnect: settings.autoReconnect,
    sendToCustomer: settings.sendToCustomer,
    sendToBusiness: settings.sendToBusiness,
    businessNotificationNumber: settings.businessNotificationNumber,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt
  }
})
