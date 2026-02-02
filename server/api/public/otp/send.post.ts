import { sendOtp } from '~~/server/utils/otp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone } = body

  if (!phone) {
    throw createError({
      statusCode: 400,
      message: 'Phone number is required'
    })
  }

  // Validate phone format (basic validation)
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    throw createError({
      statusCode: 400,
      message: 'Invalid phone number format'
    })
  }

  const result = await sendOtp(phone)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error,
      data: { cooldownSeconds: result.cooldownSeconds }
    })
  }

  return {
    success: true,
    message: 'Verification code sent to your WhatsApp'
  }
})
