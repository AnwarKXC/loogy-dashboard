import { createError, eventHandler, readBody } from 'h3'
import { z } from 'zod'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const deleteCustomersSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Select at least one customer')
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readBody(event)
  const payload = deleteCustomersSchema.parse(body)

  const result = await prisma.user.deleteMany({
    where: {
      id: { in: payload.ids },
      role: 'CUSTOMER'
    }
  })

  if (result.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No matching customers found' })
  }

  return {
    deleted: result.count
  }
})
