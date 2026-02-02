import prisma from '../db'
import { sendWhatsAppMessage, isConnected } from './whatsapp'
import { randomUUID } from 'crypto'

const OTP_EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 3
const RESEND_COOLDOWN_SECONDS = 60

/**
 * Generate a random 6-digit OTP code
 */
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Format phone number consistently
 */
function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')

  // If starts with 0, assume Egyptian number and add 20
  if (cleaned.startsWith('0')) {
    cleaned = '20' + cleaned.substring(1)
  }

  // If doesn't start with country code, assume Egyptian
  if (!cleaned.startsWith('20') && cleaned.length === 10) {
    cleaned = '20' + cleaned
  }

  return cleaned
}

/**
 * Send OTP to a phone number via WhatsApp
 */
export async function sendOtp(phone: string): Promise<{
  success: boolean
  error?: string
  cooldownSeconds?: number
}> {
  // Check if WhatsApp is connected
  if (!isConnected()) {
    return { success: false, error: 'WhatsApp is not connected' }
  }

  const formattedPhone = formatPhone(phone)

  // Check for recent OTP (cooldown)
  const recentOtp = await prisma.phoneOtp.findFirst({
    where: {
      phone: formattedPhone,
      createdAt: {
        gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000)
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (recentOtp) {
    const waitTime = Math.ceil(
      (recentOtp.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
    )
    return {
      success: false,
      error: `Please wait ${waitTime} seconds before requesting a new code`,
      cooldownSeconds: waitTime
    }
  }

  // Generate new OTP
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // Save OTP to database
  await prisma.phoneOtp.create({
    data: {
      phone: formattedPhone,
      code,
      expiresAt
    }
  })

  // Send OTP via WhatsApp
  const message = `🔐 *رمز التحقق*

رمز التحقق الخاص بك هو: *${code}*

⏱️ صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق

---
🔐 *Verification Code*

Your verification code is: *${code}*

⏱️ Valid for ${OTP_EXPIRY_MINUTES} minutes

_لا تشارك هذا الرمز مع أي شخص_
_Do not share this code with anyone_`

  const result = await sendWhatsAppMessage(phone, message)

  if (!result.success) {
    // Delete the OTP if sending failed
    await prisma.phoneOtp.deleteMany({
      where: { phone: formattedPhone, code }
    })
    return { success: false, error: result.error || 'Failed to send OTP' }
  }

  return { success: true }
}

/**
 * Verify an OTP code
 */
export async function verifyOtp(phone: string, code: string): Promise<{
  success: boolean
  error?: string
  attemptsRemaining?: number
  token?: string
}> {
  const formattedPhone = formatPhone(phone)

  // Find the most recent valid OTP for this phone
  const otp = await prisma.phoneOtp.findFirst({
    where: {
      phone: formattedPhone,
      verified: false,
      expiresAt: { gte: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!otp) {
    return { success: false, error: 'OTP expired or not found. Please request a new code.' }
  }

  // Check attempts
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Too many failed attempts. Please request a new code.' }
  }

  // Verify code
  if (otp.code !== code) {
    // Increment attempts
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } }
    })

    const attemptsRemaining = MAX_ATTEMPTS - otp.attempts - 1
    return {
      success: false,
      error: `Invalid code. ${attemptsRemaining} attempts remaining.`,
      attemptsRemaining
    }
  }

  // Mark as verified
  await prisma.phoneOtp.update({
    where: { id: otp.id },
    data: { verified: true }
  })

  // Clean up old OTPs for this phone
  await prisma.phoneOtp.deleteMany({
    where: {
      phone: formattedPhone,
      id: { not: otp.id }
    }
  })

  // Create or update auth token for this phone (persists indefinitely)
  const newToken = randomUUID()
  await prisma.phoneAuthToken.upsert({
    where: { phone: formattedPhone },
    create: {
      phone: formattedPhone,
      token: newToken
    },
    update: {
      token: newToken,
      updatedAt: new Date()
    }
  })

  return { success: true, token: newToken }
}

/**
 * Check if a phone number is verified (has a verified OTP within last 24 hours)
 */
export async function isPhoneVerified(phone: string): Promise<boolean> {
  const formattedPhone = formatPhone(phone)

  const verifiedOtp = await prisma.phoneOtp.findFirst({
    where: {
      phone: formattedPhone,
      verified: true,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      }
    }
  })

  return !!verifiedOtp
}

/**
 * Verify an auth token and return the associated phone number
 */
export async function verifyAuthToken(token: string): Promise<{
  valid: boolean
  phone?: string
}> {
  if (!token) {
    return { valid: false }
  }

  const authToken = await prisma.phoneAuthToken.findUnique({
    where: { token }
  })

  if (!authToken) {
    return { valid: false }
  }

  return { valid: true, phone: authToken.phone }
}

/**
 * Get auth token for a phone number (if exists)
 */
export async function getAuthTokenForPhone(phone: string): Promise<string | null> {
  const formattedPhone = formatPhone(phone)

  const authToken = await prisma.phoneAuthToken.findUnique({
    where: { phone: formattedPhone }
  })

  return authToken?.token || null
}

/**
 * Clean up expired OTPs (call periodically)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.phoneOtp.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          verified: true,
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      ]
    }
  })

  return result.count
}
