import { create, type Whatsapp, type CreateConfig } from '@wppconnect-team/wppconnect'
import prisma from '../db'

// Singleton instance of WPPConnect client
let whatsappClient: Whatsapp | null = null
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed' = 'disconnected'
let currentQrCode: string | null = null
let initializationInProgress = false // Mutex to prevent concurrent initialization

// Event emitter for QR code updates
type QrCodeListener = (qrCode: string) => void
const qrCodeListeners: Set<QrCodeListener> = new Set()

export function addQrCodeListener(listener: QrCodeListener) {
  qrCodeListeners.add(listener)
  // Send current QR code if available
  if (currentQrCode) {
    listener(currentQrCode)
  }
}

export function removeQrCodeListener(listener: QrCodeListener) {
  qrCodeListeners.delete(listener)
}

function notifyQrCodeListeners(qrCode: string) {
  currentQrCode = qrCode
  qrCodeListeners.forEach(listener => listener(qrCode))
}

export function getConnectionStatus() {
  return connectionStatus
}

export function getCurrentQrCode() {
  console.log('getCurrentQrCode called, length:', currentQrCode?.length || 0)
  return currentQrCode
}

export function isConnected() {
  return connectionStatus === 'connected' && whatsappClient !== null
}

/**
 * Initialize WhatsApp connection
 */
export async function initializeWhatsApp(): Promise<{ success: boolean, error?: string }> {
  // Prevent concurrent initialization attempts
  if (initializationInProgress) {
    console.log('WhatsApp initialization already in progress, skipping...')
    return { success: false, error: 'Connection already in progress' }
  }

  if (connectionStatus === 'connecting') {
    return { success: false, error: 'Connection already in progress' }
  }

  if (connectionStatus === 'connected' && whatsappClient) {
    return { success: true }
  }

  // Set mutex immediately
  initializationInProgress = true

  // If there's an existing client that failed, clean it up first
  if (whatsappClient) {
    try {
      await whatsappClient.close()
    } catch {
      // Ignore close errors
    }
    whatsappClient = null
  }

  connectionStatus = 'connecting'
  currentQrCode = null

  try {
    // Update database status
    await updateWhatsAppSettings({ connectionStatus: 'connecting', qrCode: null })

    const config = {
      session: 'dashboard-whatsapp',
      catchQR: async (base64Qr: string, _asciiQR: string, _attempts: number, _urlCode?: string) => {
        console.log('QR Code received, scan with WhatsApp')
        console.log('QR Code length:', base64Qr?.length || 0)
        currentQrCode = base64Qr
        notifyQrCodeListeners(base64Qr)

        // Store QR code in database
        await updateWhatsAppSettings({ qrCode: base64Qr, connectionStatus: 'connecting' })
      },
      statusFind: async (statusSession: string, session: string) => {
        console.log(`WhatsApp Status: ${statusSession} - Session: ${session}`)

        if (statusSession === 'isLogged' || statusSession === 'inChat') {
          connectionStatus = 'connected'
          currentQrCode = null
          initializationInProgress = false
          await updateWhatsAppSettings({
            connectionStatus: 'connected',
            qrCode: null,
            lastConnected: new Date()
          })
        } else if (statusSession === 'browserClose') {
          // Only set disconnected if browser actually closed
          connectionStatus = 'disconnected'
          initializationInProgress = false
          await updateWhatsAppSettings({ connectionStatus: 'disconnected' })
        }
        // Note: 'notLogged' and 'disconnectedMobile' are normal states during QR scanning
        // Don't change connectionStatus for these - keep it as 'connecting'
      },
      headless: true,
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: false,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      autoClose: 0, // Never auto close
      createPathFileToken: true,
      folderNameToken: './.wppconnect-tokens'
    }

    whatsappClient = await create(config)

    // Set up event listeners
    whatsappClient.onStateChange((state) => {
      console.log('WhatsApp state changed:', state)
      if (state === 'CONNECTED') {
        connectionStatus = 'connected'
        updateWhatsAppSettings({ connectionStatus: 'connected', lastConnected: new Date() })
      } else if (state === 'CONFLICT') {
        connectionStatus = 'disconnected'
        updateWhatsAppSettings({ connectionStatus: 'disconnected' })
      }
    })

    connectionStatus = 'connected'
    initializationInProgress = false
    await updateWhatsAppSettings({ connectionStatus: 'connected', lastConnected: new Date() })

    return { success: true }
  } catch (error) {
    console.error('Failed to initialize WhatsApp:', error)
    connectionStatus = 'failed'
    initializationInProgress = false
    await updateWhatsAppSettings({ connectionStatus: 'failed' })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Disconnect WhatsApp
 */
export async function disconnectWhatsApp(): Promise<{ success: boolean }> {
  if (whatsappClient) {
    try {
      await whatsappClient.close()
    } catch (error) {
      console.error('Error closing WhatsApp:', error)
    }
    whatsappClient = null
  }

  connectionStatus = 'disconnected'
  currentQrCode = null
  initializationInProgress = false
  await updateWhatsAppSettings({ connectionStatus: 'disconnected', qrCode: null })

  return { success: true }
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean, error?: string }> {
  if (!whatsappClient || connectionStatus !== 'connected') {
    return { success: false, error: 'WhatsApp not connected' }
  }

  try {
    // Format phone number (remove + and spaces, ensure it starts with country code)
    const formattedPhone = formatPhoneNumber(phone)

    await whatsappClient.sendText(`${formattedPhone}@c.us`, message)
    return { success: true }
  } catch (error) {
    // Handle "Message not found" error - this happens when message is sent successfully
    // but WPPConnect fails to retrieve it for confirmation. The message was still sent.
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('not found') || errorMessage.includes('Message true_')) {
      console.log('WhatsApp message sent (retrieval confirmation failed, but message was delivered)')
      return { success: true }
    }

    console.error('Failed to send WhatsApp message:', error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Format phone number for WhatsApp
 */
function formatPhoneNumber(phone: string): string {
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
 * Send order notification to business WhatsApp
 */
export async function sendOrderNotification(order: {
  id: number
  customerName: string
  customerPhone: string
  shippingCity: string
  shippingStreet: string
  totalAmount: number
  items: Array<{
    productName: unknown
    quantity: number
    price: number
  }>
  notes?: string | null
}, baseUrl?: string): Promise<{ success: boolean, error?: string }> {
  const settings = await getWhatsAppSettings()

  if (!settings?.isEnabled || !settings.sendToBusiness) {
    return { success: false, error: 'WhatsApp notifications disabled' }
  }

  // Collect all recipient phones
  const recipientPhones: string[] = []
  if (settings.recipientPhone) {
    recipientPhones.push(settings.recipientPhone)
  }
  if (settings.businessNotificationNumber && settings.businessNotificationNumber !== settings.recipientPhone) {
    recipientPhones.push(settings.businessNotificationNumber)
  }

  if (recipientPhones.length === 0) {
    return { success: false, error: 'No recipient phone configured' }
  }

  // Build order URL
  const siteUrl = baseUrl || process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
  const orderUrl = `${siteUrl}/admin/orders/${order.id}`

  // Build order message
  const itemsList = order.items.map((item) => {
    const name = typeof item.productName === 'object' && item.productName !== null
      ? ((item.productName as Record<string, string>).ar || (item.productName as Record<string, string>).en || 'Product')
      : String(item.productName || 'Product')
    return `• ${name} x${item.quantity} - ${item.price} EGP`
  }).join('\n')

  const message = `🛒 *طلب جديد #${order.id}*

👤 *العميل:* ${order.customerName}
📱 *الهاتف:* ${order.customerPhone}

📍 *العنوان:*
${order.shippingCity}
${order.shippingStreet}

📦 *المنتجات:*
${itemsList}

💰 *الإجمالي:* ${order.totalAmount} EGP

${order.notes ? `📝 *ملاحظات:* ${order.notes}\n` : ''}
🔗 *رابط الطلب:* ${orderUrl}

---
_تم استلام الطلب من المتجر_`

  // Send to all recipient phones
  const results = await Promise.all(
    recipientPhones.map(phone => sendWhatsAppMessage(phone, message))
  )

  // Return success if at least one message was sent
  const successCount = results.filter(r => r.success).length
  if (successCount === 0) {
    return { success: false, error: results[0]?.error || 'Failed to send messages' }
  }

  return { success: true }
}

/**
 * Get WhatsApp settings from database
 */
export async function getWhatsAppSettings() {
  let settings = await prisma.whatsAppSettings.findFirst()

  if (!settings) {
    // Create default settings
    settings = await prisma.whatsAppSettings.create({
      data: {
        isEnabled: false,
        connectionStatus: 'disconnected',
        sendToBusiness: true,
        sendToCustomer: false,
        autoReconnect: true
      }
    })
  }

  return settings
}

/**
 * Update WhatsApp settings in database
 */
export async function updateWhatsAppSettings(data: {
  isEnabled?: boolean
  connectionStatus?: string
  businessPhone?: string | null
  recipientPhone?: string | null
  lastConnected?: Date | null
  qrCode?: string | null
  autoReconnect?: boolean
  sendToCustomer?: boolean
  sendToBusiness?: boolean
  businessNotificationNumber?: string | null
}) {
  const settings = await getWhatsAppSettings()

  return prisma.whatsAppSettings.update({
    where: { id: settings.id },
    data
  })
}

/**
 * Send order confirmation to customer via WhatsApp
 */
export async function sendCustomerOrderConfirmation(order: {
  id: number
  customerName: string
  customerPhone: string
  shippingCity: string
  shippingStreet: string
  totalAmount: number
  items: Array<{
    productName: unknown
    quantity: number
    price: number
  }>
}, baseUrl?: string): Promise<{ success: boolean, error?: string }> {
  const settings = await getWhatsAppSettings()

  if (!settings?.isEnabled || !settings.sendToCustomer) {
    return { success: false, error: 'Customer WhatsApp notifications disabled' }
  }

  // Get site URL
  const siteUrl = baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const trackOrderUrl = `${siteUrl}/track-order?orderNumber=${order.id}`

  // Build items list
  const itemsList = order.items.map((item) => {
    const name = typeof item.productName === 'object' && item.productName !== null
      ? ((item.productName as Record<string, string>).ar || (item.productName as Record<string, string>).en || 'Product')
      : String(item.productName || 'Product')
    return `• ${name} x${item.quantity} - ${item.price} ج.م`
  }).join('\n')

  const message = `✅ *تأكيد الطلب #${order.id}*

مرحباً ${order.customerName}! 👋

شكراً لطلبك من متجرنا. تم استلام طلبك بنجاح.

📦 *تفاصيل الطلب:*
${itemsList}

💰 *الإجمالي:* ${order.totalAmount} ج.م

📍 *عنوان التوصيل:*
${order.shippingCity}
${order.shippingStreet}

🔗 *تتبع طلبك:*
${trackOrderUrl}

---

✅ *Order Confirmation #${order.id}*

Hello ${order.customerName}! 👋

Thank you for your order. We have received it successfully.

💰 *Total:* ${order.totalAmount} EGP

🔗 *Track your order:*
${trackOrderUrl}

_سنقوم بالتواصل معك قريباً لتأكيد موعد التوصيل_
_We will contact you soon to confirm delivery time_`

  const result = await sendWhatsAppMessage(order.customerPhone, message)
  return result
}

/**
 * Send order confirmed (PROCESSING) notification to customer
 * Called when order status changes to PROCESSING
 */
export async function sendOrderProcessingNotification(order: {
  id: number
  customerName: string
  customerPhone: string
  totalAmount: number
}, baseUrl?: string): Promise<{ success: boolean, error?: string }> {
  const settings = await getWhatsAppSettings()

  if (!settings?.isEnabled || !settings.sendToCustomer) {
    return { success: false, error: 'Customer WhatsApp notifications disabled' }
  }

  const siteUrl = baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const trackOrderUrl = `${siteUrl}/track-order?orderNumber=${order.id}`

  const message = `🎉 *تم تأكيد طلبك #${order.id}*

مرحباً ${order.customerName}! 👋

نسعدك بإعلامك أن طلبك قد تم تأكيده وجاري تجهيزه الآن! ✅

💰 *الإجمالي:* ${order.totalAmount} ج.م

🔗 *تتبع حالة طلبك:*
${trackOrderUrl}

سنقوم بإعلامك عند شحن طلبك 📦

---

🎉 *Order #${order.id} Confirmed*

Hello ${order.customerName}! 👋

We're happy to inform you that your order has been confirmed and is being prepared! ✅

💰 *Total:* ${order.totalAmount} EGP

🔗 *Track your order:*
${trackOrderUrl}

We will notify you when your order is shipped 📦`

  const result = await sendWhatsAppMessage(order.customerPhone, message)
  return result
}

/**
 * Send order shipped (SHIPPING) notification to customer
 * Called when order status changes to SHIPPING
 */
export async function sendOrderShippingNotification(order: {
  id: number
  customerName: string
  customerPhone: string
  shippingCity: string
  shippingStreet: string
  totalAmount: number
  paymentMethod: string
}, baseUrl?: string): Promise<{ success: boolean, error?: string }> {
  const settings = await getWhatsAppSettings()

  if (!settings?.isEnabled || !settings.sendToCustomer) {
    return { success: false, error: 'Customer WhatsApp notifications disabled' }
  }

  const siteUrl = baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const trackOrderUrl = `${siteUrl}/track-order?orderNumber=${order.id}`

  // Payment info for COD orders
  const isCOD = order.paymentMethod === 'CASH'
  const paymentNote = isCOD
    ? `💵 *المبلغ المطلوب عند الاستلام:* ${order.totalAmount} ج.م`
    : `✅ *تم الدفع مسبقاً*`

  const paymentNoteEn = isCOD
    ? `💵 *Amount to pay on delivery:* ${order.totalAmount} EGP`
    : `✅ *Already paid*`

  const message = `🚚 *طلبك #${order.id} في الطريق إليك!*

مرحباً ${order.customerName}! 👋

أخبار سارة! 🎉 تم شحن طلبك وهو في الطريق إليك الآن.

📍 *عنوان التوصيل:*
${order.shippingCity}
${order.shippingStreet}

⏱ *الوقت المتوقع للتوصيل:* 1-2 يوم عمل

${paymentNote}

🔗 *تتبع طلبك:*
${trackOrderUrl}

يرجى التأكد من توفرك لاستلام الطلب 📱

---

🚚 *Your Order #${order.id} is On Its Way!*

Hello ${order.customerName}! 👋

Great news! 🎉 Your order has been shipped and is on its way to you.

📍 *Delivery Address:*
${order.shippingCity}
${order.shippingStreet}

⏱ *Expected Delivery:* 1-2 business days

${paymentNoteEn}

🔗 *Track your order:*
${trackOrderUrl}

Please make sure you are available to receive the order 📱`

  const result = await sendWhatsAppMessage(order.customerPhone, message)
  return result
}

/**
/**
 * Cleanup handler for graceful shutdown
 */
async function cleanup() {
  if (whatsappClient) {
    console.log('Cleaning up WhatsApp client...')
    try {
      await whatsappClient.close()
    } catch {
      // Ignore errors during cleanup
    }
    whatsappClient = null
  }
}

// Handle process exit signals
if (typeof process !== 'undefined') {
  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
  process.on('beforeExit', cleanup)
}
