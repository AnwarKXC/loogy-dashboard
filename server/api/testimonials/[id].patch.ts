import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

const BodySchema = z.object({
  customerName: z.string().max(100).nullable().optional(),
  content: z.string().max(2000).nullable().optional(),
  images: z.array(z.string().url()).optional(),
  source: z.string().max(50).nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  isPublished: z.boolean().optional(),
  displayOrder: z.number().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)
  const body = await readValidatedBody(event, BodySchema.parse)

  const existing = await prisma.testimonial.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Testimonial not found'
    })
  }

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: body
  })

  return testimonial
})
