import { eventHandler, getRouterParam, createError, getQuery } from 'h3'

import prisma from '../../../db'
import { getPreferredTranslation } from '../../../utils/products'

export default eventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const lang = (query.lang as string) || 'en'

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Category slug is required'
    })
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      parentId: true,
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
    }
  })

  if (!category) {
    throw createError({
      statusCode: 404,
      message: 'Category not found'
    })
  }

  const preferred = [lang.toLowerCase(), 'en', 'ar']
  const name = getPreferredTranslation(category.translations, 'name', preferred)
  const description = getPreferredTranslation(category.translations, 'description', preferred)
  const metaTitle = getPreferredTranslation(category.translations, 'metaTitle', preferred)
  const metaDescription = getPreferredTranslation(category.translations, 'metaDescription', preferred)
  const metaKeywords = getPreferredTranslation(category.translations, 'metaKeywords', preferred)
  const ogTitle = getPreferredTranslation(category.translations, 'ogTitle', preferred)
  const ogDescription = getPreferredTranslation(category.translations, 'ogDescription', preferred)
  const ogImage = getPreferredTranslation(category.translations, 'ogImage', preferred)

  return {
    id: category.id,
    name,
    description,
    slug: category.slug,
    parentId: category.parentId,
    image: ogImage || null,
    productCount: category._count.products,
    seo: {
      title: metaTitle || name,
      description: metaDescription || description,
      keywords: metaKeywords || null,
      ogTitle: ogTitle || metaTitle || name || null,
      ogDescription: ogDescription || metaDescription || description || null,
      ogImage: ogImage || null
    },
    translations: category.translations
  }
})
