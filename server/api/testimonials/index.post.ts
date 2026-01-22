import { z } from 'zod'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const BodySchema = z.object({
  customerName: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).default([]),
  source: z.string().max(50).optional(),
  rating: z.number().min(1).max(5).optional(),
  isPublished: z.boolean().default(false),
  displayOrder: z.number().default(0)
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readValidatedBody(event, BodySchema.parse)

  const testimonial = await prisma.testimonial.create({
    data: body
  })

  return testimonial
})
