import { verifyOtp } from '~~/server/utils/otp'

export default defineEventHandler( async ( event ) => {
  const body = await readBody( event )
  const { phone, code } = body

  if ( !phone ) {
    throw createError( {
      statusCode: 400,
      message: 'Phone number is required'
    } )
  }

  if ( !code ) {
    throw createError( {
      statusCode: 400,
      message: 'Verification code is required'
    } )
  }

  // Validate code format (6 digits)
  if ( !/^\d{6}$/.test( code ) ) {
    throw createError( {
      statusCode: 400,
      message: 'Verification code must be 6 digits'
    } )
  }

  const result = await verifyOtp( phone, code )

  if ( !result.success ) {
    throw createError( {
      statusCode: 400,
      message: result.error,
      data: { attemptsRemaining: result.attemptsRemaining }
    } )
  }

  return {
    success: true,
    message: 'Phone number verified successfully',
    token: result.token
  }
} )