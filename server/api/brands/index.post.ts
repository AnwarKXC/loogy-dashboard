import { eventHandler, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { createBrandName, generateUniqueBrandSlug, mapBrandRecord } from '../../utils/brands'
import type { BrandRecord } from '../../utils/brands'

const createBrandSchema = z.object({
  nameEn: z.string().trim().min(1, 'Brand name (English) is required'),
  nameAr: z.string().trim().optional(),
  logo: z.string().url().optional().nullable()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readBody(event)
  const payload = createBrandSchema.parse(body)

  const slug = await generateUniqueBrandSlug(payload.nameEn)

  const brand = await prisma.brand.create({
    data: {
      name: createBrandName(payload.nameEn, payload.nameAr),
      slug,
      logo: payload.logo ?? null
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  })

  setResponseStatus(event, 201)

  return {
    brand: mapBrandRecord(brand as unknown as BrandRecord, getLocalizedString)
  }
})
