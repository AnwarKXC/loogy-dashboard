import { eventHandler, getQuery } from 'h3'
import { z } from 'zod'

import type { Prisma } from '@prisma/client'
import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(['newest', 'oldest', 'name-asc', 'name-desc']).catch('newest')
})

type SortKey = z.infer<typeof querySchema>['sort']

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = querySchema.parse(getQuery(event))
  const whereClauses: Record<string, unknown>[] = []

  if (query.search) {
    const searchTerm = query.search

    whereClauses.push({
      OR: [
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { translations: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } }
      ]
    })
  }

  const where = whereClauses.length > 0 ? { AND: whereClauses } : {}

  const orderByMap: Record<SortKey, Prisma.BrandOrderByWithRelationInput[]> = {
    'newest': [{ createdAt: 'desc' }],
    'oldest': [{ createdAt: 'asc' }],
    'name-asc': [{ slug: 'asc' }],
    'name-desc': [{ slug: 'desc' }]
  }

  const page = query.page
  const pageSize = query.pageSize
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [totalItems, records] = await prisma.$transaction([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy: orderByMap[query.sort],
      include: {
        translations: {
          select: {
            lang: true,
            name: true,
            description: true,
            metaTitle: true,
            metaDescription: true,
            metaKeywords: true,
            ogTitle: true,
            ogDescription: true,
            ogImage: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      skip,
      take
    })
  ])

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  const items = records.map((record) => {
    const enTranslation = record.translations.find(t => t.lang === 'EN')
    const arTranslation = record.translations.find(t => t.lang === 'AR')

    return {
      id: record.id,
      name: enTranslation?.name ?? record.slug,
      slug: record.slug,
      logo: record.logo,
      description: enTranslation?.description ?? null,
      productCount: record._count.products,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      translations: {
        en: enTranslation?.name ?? '',
        ar: arTranslation?.name ?? ''
      },
      translationsRaw: record.translations
    }
  })

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  }
})
