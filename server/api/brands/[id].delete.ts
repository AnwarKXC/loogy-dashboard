import { eventHandler, createError } from 'h3'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { mapBrandRecord } from '../../utils/brands'
import type { BrandRecord } from '../../utils/brands'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

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
          products: {
            where: { isArchived: false }
          }
        }
      }
    }
  })

  if (!brand) {
    throw createError({ statusCode: 404, statusMessage: 'Brand not found' })
  }

  // Check for non-archived products only
  if (brand._count.products > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Reassign or archive products before deleting this brand' })
  }

  // Unlink archived products from this brand before deleting
  await prisma.product.updateMany({
    where: { brandId: brandId, isArchived: true },
    data: { brandId: null }
  })

  await prisma.brand.delete({ where: { id: brandId } })

  return {
    brand: mapBrandRecord(brand as unknown as BrandRecord, getLocalizedString)
  }
})
