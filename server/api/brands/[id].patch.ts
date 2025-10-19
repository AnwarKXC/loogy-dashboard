import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { createBrandName, generateUniqueBrandSlug, mapBrandRecord, normalizeTranslations } from '../../utils/brands'
import type { BrandRecord } from '../../utils/brands'

const updateBrandSchema = z.object({
  nameEn: z.string().trim().min(1, 'Brand name (English) is required').optional(),
  nameAr: z.string().trim().optional(),
  logo: z.string().url().nullable().optional()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const idParam = event.context.params?.id
  const brandId = Number(idParam)

  if (!Number.isFinite(brandId) || brandId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid brand id' })
  }

  const existing = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Brand not found' })
  }

  const body = await readBody(event)
  const payload = updateBrandSchema.parse(body)

  const translations = normalizeTranslations(existing.name)
  const nextNameEn = payload.nameEn ?? translations.en ?? existing.slug

  if (!nextNameEn || nextNameEn.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Brand name (English) is required' })
  }

  const nextNameAr = payload.nameAr !== undefined ? payload.nameAr : translations.ar

  const slugSource = payload.nameEn ?? existing.slug
  const slug = await generateUniqueBrandSlug(slugSource, brandId)

  const updated = await prisma.brand.update({
    where: { id: brandId },
    data: {
      name: createBrandName(nextNameEn, nextNameAr),
      slug,
      logo: payload.logo !== undefined ? payload.logo ?? null : existing.logo
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  })

  return {
    brand: mapBrandRecord(updated as unknown as BrandRecord, getLocalizedString)
  }
})
