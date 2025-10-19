import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { hashPassword, requireSuperAdmin } from '../../utils/superadmin-session'

const createSuperAdminSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120).optional(),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MANAGER', 'SALES'])
})

export default eventHandler(async (event) => {
  const owner = await requireSuperAdmin(event, { roles: ['OWNER'] })
  const body = await readBody(event)
  const payload = createSuperAdminSchema.parse(body)

  const normalizedEmail = payload.email.toLowerCase()
  const existing = await prisma.superAdmin.findUnique({ where: { email: normalizedEmail } })

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
  }

  const passwordHash = await hashPassword(payload.password)

  const account = await prisma.superAdmin.create({
    data: {
      email: normalizedEmail,
      name: payload.name?.trim() || null,
      role: payload.role,
      passwordHash,
      createdById: owner.id
    }
  })

  return {
    superAdmin: {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role
    }
  }
})
