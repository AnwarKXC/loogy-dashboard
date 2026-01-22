import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)

  const testimonial = await prisma.testimonial.findUnique({
    where: { id }
  })

  if (!testimonial) {
    throw createError({
      statusCode: 404,
      message: 'Testimonial not found'
    })
  }

  return testimonial
})
