import webpush from 'web-push'
import prisma from '../db'

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BJWPjWnrMzRngv5j3qVQCyumEN7983hfZpIugZi735JSK5CzmZiH8oi86wGZlceSxNdn307WjAN9nhh2o_n_v0o',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'Py7GHvUYu319VK3Sd--ME7rTxypPwSeCxsm1N4htjMo'
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

export const getVapidPublicKey = () => vapidKeys.publicKey

export const sendPushNotification = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

export const notifyAdmins = async (title: string, body: string, url?: string, type: 'ORDER' | 'MESSAGE' = 'ORDER') => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      include: {
        superAdmin: true
      }
    })

    const filteredSubscriptions = subscriptions.filter((sub) => {
      if (type === 'ORDER') return sub.superAdmin.notifyOrders
      if (type === 'MESSAGE') return sub.superAdmin.notifyMessages
      return true
    })

    const payload = {
      title,
      body,
      url: url || '/',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png'
    }

    const results = await Promise.allSettled(
      filteredSubscriptions.map(sub =>
        sendPushNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload)
      )
    )

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length
    console.log(`Sent push notifications to ${successCount}/${filteredSubscriptions.length} admins`)

    return successCount > 0
  } catch (error) {
    console.error('Error notifying admins:', error)
    return false
  }
}
