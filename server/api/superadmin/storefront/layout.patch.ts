import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const payloadSchema = z.object({
  data: z.unknown()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readBody(event)
  const payload = payloadSchema.parse(body)

  if (payload.data === null || payload.data === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Content data is required' })
  }

  const content = await prisma.storefrontContent.upsert({
    where: { key: 'layout' },
    create: {
      key: 'layout',
      data: payload.data
    },
    update: {
      data: payload.data
    },
    select: {
      id: true,
      key: true,
      data: true,
      updatedAt: true
    }
  })

  return {
    content
  }
})
