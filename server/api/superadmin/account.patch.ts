import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { hashPassword, requireSuperAdmin, verifyPassword } from '../../utils/superadmin-session'

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

const updateAccountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120).optional(),
  email: z.string().email('Enter a valid email address').optional(),
  passwordChange: passwordChangeSchema.optional()
}).refine(data => data.name !== undefined || data.email !== undefined || data.passwordChange !== undefined, {
  message: 'No changes provided'
})

export default eventHandler(async (event) => {
  const superAdmin = await requireSuperAdmin(event)
  const body = await readBody(event)
  const payload = updateAccountSchema.parse(body)

  const updates: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    updates.name = payload.name
  }

  if (payload.email !== undefined) {
    const normalizedEmail = payload.email.toLowerCase()
    if (normalizedEmail !== superAdmin.email) {
      const exists = await prisma.superAdmin.findUnique({ where: { email: normalizedEmail } })
      if (exists) {
        throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
      }
    }

    updates.email = normalizedEmail
  }

  if (payload.passwordChange) {
    const isValid = await verifyPassword(payload.passwordChange.currentPassword, superAdmin.passwordHash)
    if (!isValid) {
      throw createError({ statusCode: 400, statusMessage: 'Current password is incorrect' })
    }

    updates.passwordHash = await hashPassword(payload.passwordChange.newPassword)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }

  const updated = await prisma.superAdmin.update({
    where: { id: superAdmin.id },
    data: updates
  })

  // Update the session cache if changed email or name
  event.context.superAdmin = updated

  return {
    superAdmin: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role
    }
  }
})
