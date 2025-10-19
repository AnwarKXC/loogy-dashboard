import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { createSuperAdminSession, verifyPassword } from '../../utils/superadmin-session'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = loginSchema.parse(body)
  const normalizedEmail = email.toLowerCase()

  const superAdmin = await prisma.superAdmin.findUnique({ where: { email: normalizedEmail } })

  if (!superAdmin) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const isValid = await verifyPassword(password, superAdmin.passwordHash)
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const sessionAdmin = await createSuperAdminSession(event, superAdmin.id)

  return {
    superAdmin: {
      id: sessionAdmin.id,
      email: sessionAdmin.email,
      name: sessionAdmin.name,
      role: sessionAdmin.role
    }
  }
})
