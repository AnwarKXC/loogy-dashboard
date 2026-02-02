import { disconnectWhatsApp } from '~~/server/utils/whatsapp'

export default defineEventHandler(async () => {
  const result = await disconnectWhatsApp()
  return result
})
