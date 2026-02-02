import { getConnectionStatus, getCurrentQrCode, isConnected } from '~~/server/utils/whatsapp'

export default defineEventHandler(() => {
  return {
    status: getConnectionStatus(),
    qrCode: getCurrentQrCode(),
    isConnected: isConnected()
  }
})
