import { eventHandler, getRouterParam, createError } from 'h3'

import prisma from '../../../../db'
import { getLocalizedString } from '../../../../utils/products'

const DEFAULT_CONTENT = {
  images: {} as Record<string, string>
}

type StorefrontCategoryContent = typeof DEFAULT_CONTENT

function normalizeContent(value: unknown): StorefrontCategoryContent {
  if (!value || typeof value !== 'object') {
    return DEFAULT_CONTENT
  }

  const payload = value as StorefrontCategoryContent

  return {
    images: payload.images ?? {}
  }
}

export default eventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Category slug is required' })
  }

  const [content, category] = await prisma.$transaction([
  
    prisma.storefrontContent.findUnique({ where: { key: 'categories' } }),
    prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        parentId: true,
        translations: {
          select: {
            lang: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    })
  ])

  if (!category) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  const resolvedContent = normalizeContent(content?.data ?? DEFAULT_CONTENT)
  const nameValue = Object.fromEntries(
    (category.translations ?? []).map((translation: (typeof category.translations)[number]) => [
      translation.lang.toLowerCase(),
      translation.name
    ])
  )

  return {
    id: category.id,
    name: getLocalizedString(nameValue),
    slug: category.slug,
    parentId: category.parentId,
    productCount: category._count.products,
    image: resolvedContent.images[category.slug] ?? null
  }
})
