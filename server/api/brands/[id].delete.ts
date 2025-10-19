import { eventHandler, createError } from 'h3'

import { prisma } from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { mapBrandRecord } from '../../utils/brands'
import type { BrandRecord } from '../../utils/brands'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER'] })

  const idParam = event.context.params?.id
  const brandId = Number(idParam)

  if (!Number.isFinite(brandId) || brandId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid brand id' })
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  })

  if (!brand) {
    throw createError({ statusCode: 404, statusMessage: 'Brand not found' })
  }

  if (brand._count.products > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Reassign or archive products before deleting this brand' })
  }

  await prisma.brand.delete({ where: { id: brandId } })

  return {
    brand: mapBrandRecord(brand as unknown as BrandRecord, getLocalizedString)
  }
})
