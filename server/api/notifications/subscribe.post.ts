import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const subscriptionSchema = z.object({
  endpoint: z.string(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
})

export default eventHandler(async (event) => {
  const superAdmin = await requireSuperAdmin(event)
  const body = await readBody(event)

  const subscription = subscriptionSchema.parse(body)

  // Save or update subscription
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      superAdminId: superAdmin.id
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      superAdminId: superAdmin.id
    }
  })

  return { success: true }
})
