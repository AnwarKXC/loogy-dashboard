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
      message: 'Brand slug is required'
    })
  }

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      logo: true,
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

  if (!brand) {
    throw createError({
      statusCode: 404,
      message: 'Brand not found'
    })
  }

  const preferred = [lang.toLowerCase(), 'en', 'ar']
  const name = getPreferredTranslation(brand.translations, 'name', preferred)
  const description = getPreferredTranslation(brand.translations, 'description', preferred)
  const metaTitle = getPreferredTranslation(brand.translations, 'metaTitle', preferred)
  const metaDescription = getPreferredTranslation(brand.translations, 'metaDescription', preferred)
  const metaKeywords = getPreferredTranslation(brand.translations, 'metaKeywords', preferred)
  const ogTitle = getPreferredTranslation(brand.translations, 'ogTitle', preferred)
  const ogDescription = getPreferredTranslation(brand.translations, 'ogDescription', preferred)
  const ogImage = getPreferredTranslation(brand.translations, 'ogImage', preferred)

  return {
    id: brand.id,
    name,
    description,
    slug: brand.slug,
    logo: brand.logo,
    productCount: brand._count.products,
    seo: {
      title: metaTitle || name,
      description: metaDescription || description,
      keywords: metaKeywords || null,
      ogTitle: ogTitle || metaTitle || name || null,
      ogDescription: ogDescription || metaDescription || description || null,
      ogImage: ogImage || brand.logo || null
    },
    translations: brand.translations
  }
})
