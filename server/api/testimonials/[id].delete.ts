import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)

  const existing = await prisma.testimonial.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Testimonial not found'
    })
  }

  await prisma.testimonial.delete({
    where: { id }
  })

  return { success: true }
})
