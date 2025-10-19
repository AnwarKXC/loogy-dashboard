import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { customerListInclude, mapCustomerToListItem } from '../../utils/customers'

const updateCustomerSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Provide at least one field to update'
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const idParam = event.context.params?.id
  const customerId = Number(idParam)

  if (!Number.isFinite(customerId) || customerId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid customer id' })
  }

  const body = await readBody(event)
  const payload = updateCustomerSchema.parse(body)

  const existing = await prisma.user.findFirst({
    where: {
      id: customerId,
      role: 'CUSTOMER'
    }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  }

  const updated = await prisma.user.update({
    where: { id: customerId },
    data: {
      isActive: payload.status ? payload.status === 'ACTIVE' : existing.isActive
    },
    include: customerListInclude
  })

  return {
    customer: mapCustomerToListItem(updated)
  }
})
