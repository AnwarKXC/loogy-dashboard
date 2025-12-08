import { z } from 'zod'
import prisma from '../../db'
import { loadSuperAdminFromSession } from '../../utils/superadmin-session'

const subscriptionSchema = z.object({
  endpoint: z.string(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
})

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const subscription = subscriptionSchema.parse(body)

  // Try to get admin session first, then fall back to guest/customer
  const superAdmin = await loadSuperAdminFromSession(event)
  const adminId = superAdmin?.id || null

  // If no admin, this is a guest/customer subscribing
  // They are identified by userId (if they provided it via socket/state)
  // For now, we'll store with no userId (anonymous guest subscription)
  // The userId will be linked when they start a chat

  // Save or update subscription
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      ...(adminId && { adminId })
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      ...(adminId && { adminId })
    }
  })

  return { success: true }
})
