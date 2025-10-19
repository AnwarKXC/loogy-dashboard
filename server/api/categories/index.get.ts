import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import prisma from '../../utils/prisma'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { getLocalizedString } from '../products/utils'
import { buildCategoryTree } from '../../utils/categories'
import type { CategoryRecord } from '../../utils/categories'

const querySchema = z.object({
  includeProductCounts: z.coerce.boolean().catch(true)
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      createdAt: true,
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    },
    orderBy: [{ createdAt: 'asc' }]
  })

  const tree = buildCategoryTree(
    categories as unknown as CategoryRecord[],
    query.includeProductCounts,
    (value, slug) => getLocalizedString(value) || slug
  )

  return {
    categories: tree
  }
})
