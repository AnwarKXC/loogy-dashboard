import { isPhoneVerified } from '~~/server/utils/otp'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = query.phone as string

  if (!phone) {
    throw createError({
      statusCode: 400,
      message: 'Phone number is required'
    })
  }

  const verified = await isPhoneVerified(phone)

  return {
    phone,
    verified
  }
})
