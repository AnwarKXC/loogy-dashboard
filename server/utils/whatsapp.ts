import axios from 'axios'
import prisma from '../db'

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  version: string
}

interface SendMessageParams {
  to: string
  message: string
  userId: number
  messageId?: string
}

interface NotificationThrottle {
  userId: number
  lastNotificationTime: number
  messageCount: number
}

// Throttle management (in-memory, consider Redis for production)
const notificationThrottles = new Map<number, NotificationThrottle>()
const THROTTLE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

class WhatsAppService {
  private config: WhatsAppConfig

  constructor() {
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      version: process.env.WHATSAPP_API_VERSION || 'v21.0'
    }
  }

  /**
   * Check if we should send WhatsApp notification based on throttle rules
   */
  shouldSendNotification(userId: number, isAdminReply: boolean = false): boolean {
    const throttle = notificationThrottles.get(userId)
    const now = Date.now()

    // If admin replied, reset throttle
    if (isAdminReply) {
      notificationThrottles.delete(userId)
      return false // Don't notify admin about their own reply
    }

    // First message always sends
    if (!throttle) {
      notificationThrottles.set(userId, {
        userId,
        lastNotificationTime: now,
        messageCount: 1
      })
      return true
    }

    // Check if throttle period has passed
    const timeSinceLastNotification = now - throttle.lastNotificationTime

    if (timeSinceLastNotification >= THROTTLE_DURATION) {
      // Throttle expired, send notification
      throttle.lastNotificationTime = now
      throttle.messageCount += 1
      return true
    }

    // Still in throttle period
    throttle.messageCount += 1
    return false
  }

  /**
   * Reset throttle when admin replies
   */
  resetThrottle(userId: number) {
    notificationThrottles.delete(userId)
  }

  /**
   * Send WhatsApp message using Meta Cloud API
   */
  async sendMessage({ to, message, userId, messageId }: SendMessageParams): Promise<boolean> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      console.error('WhatsApp credentials not configured')
      await this.logNotification({
        userId,
        phoneNumber: to,
        content: message,
        status: 'failed',
        errorMessage: 'WhatsApp credentials not configured',
        messageId
      })
      return false
    }

    try {
      const url = `https://graph.facebook.com/${this.config.version}/${this.config.phoneNumberId}/messages`

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/[^0-9]/g, ''), // Remove any formatting
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Log successful notification
      await this.logNotification({
        userId,
        phoneNumber: to,
        content: message,
        status: 'sent',
        messageId
      })

      console.log('WhatsApp message sent successfully:', response.data)
      return true
    } catch (error: Error) {
      const errorMessage = error.response?.data?.error?.message || error.message
      console.error('Failed to send WhatsApp message:', errorMessage)

      // Log failed notification
      await this.logNotification({
        userId,
        phoneNumber: to,
        content: message,
        status: 'failed',
        errorMessage,
        messageId
      })

      return false
    }
  }

  /**
   * Send notification to admin about new user message
   */
  async notifyAdminNewMessage(
    userId: number,
    userName: string,
    messageContent: string,
    conversationId: string
  ): Promise<boolean> {
    // Check throttle
    if (!this.shouldSendNotification(userId, false)) {
      console.log(`Notification throttled for user ${userId}`)
      return false
    }

    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER
    if (!adminPhone) {
      console.error('Admin WhatsApp number not configured')
      return false
    }

    const message = `🔔 New Message from ${userName}\n\n${messageContent}\n\n📱 View conversation: ${process.env.DASHBOARD_URL || 'http://localhost:3000'}/chat?id=${conversationId}`

    return await this.sendMessage({
      to: adminPhone,
      message,
      userId
    })
  }

  /**
   * Send notification to user (optional feature)
   */
  async notifyUserReply(
    userId: number,
    userPhone: string,
    adminName: string,
    messageContent: string
  ): Promise<boolean> {
    const message = `💬 ${adminName} replied:\n\n${messageContent}`

    return await this.sendMessage({
      to: userPhone,
      message,
      userId
    })
  }

  /**
   * Log notification to database
   */
  private async logNotification(data: {
    userId: number
    phoneNumber: string
    content: string
    status: string
    errorMessage?: string
    messageId?: string
  }) {
    try {
      await prisma.whatsAppNotificationLog.create({
        data: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          content: data.content,
          status: data.status,
          errorMessage: data.errorMessage,
          messageId: data.messageId
        }
      })
    } catch (error) {
      console.error('Failed to log WhatsApp notification:', error)
    }
  }

  /**
   * Get notification stats for analytics
   */
  async getNotificationStats(userId?: number) {
    const where = userId ? { userId } : {}

    const [total, sent, failed, last24h] = await Promise.all([
      prisma.whatsAppNotificationLog.count({ where }),
      prisma.whatsAppNotificationLog.count({
        where: { ...where, status: 'sent' }
      }),
      prisma.whatsAppNotificationLog.count({
        where: { ...where, status: 'failed' }
      }),
      prisma.whatsAppNotificationLog.count({
        where: {
          ...where,
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? (sent / total) * 100 : 0,
      last24h
    }
  }
}

export const whatsappService = new WhatsAppService()
