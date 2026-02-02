import { getWhatsAppSettings, getConnectionStatus, getCurrentQrCode } from '~~/server/utils/whatsapp'

export default defineEventHandler(async () => {
  const settings = await getWhatsAppSettings()
  const liveStatus = getConnectionStatus()
  const qrCode = getCurrentQrCode()

  return {
    ...settings,
    // Override with live status
    connectionStatus: liveStatus,
    qrCode: qrCode || settings.qrCode
  }
})
