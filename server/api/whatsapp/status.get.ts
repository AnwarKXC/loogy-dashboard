import { defineEventHandler } from 'h3'
import { getConnectionStatus, getCurrentQrCode } from '../../utils/whatsapp'

export default defineEventHandler(async () => {
  return {
    status: getConnectionStatus(),
    qrCode: getCurrentQrCode()
  }
})
