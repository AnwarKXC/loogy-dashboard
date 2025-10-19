import { randomUUID } from 'crypto'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { customerListInclude, mapCustomerToListItem } from '../../utils/customers'

const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),
  email: z.string().trim().email('Invalid email'),
  phoneNumber: z.string().trim().min(5).max(32).optional()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const body = await readBody(event)
  const payload = createCustomerSchema.parse(body)

  try {
    const customer = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber ?? null,
        firebaseUid: `cust_${randomUUID()}`,
        role: 'CUSTOMER',
        isActive: true,
        lastSession: new Date()
      },
      include: customerListInclude
    })

    return {
      customer: mapCustomerToListItem(customer)
    }
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
    }

    throw error
  }
})
