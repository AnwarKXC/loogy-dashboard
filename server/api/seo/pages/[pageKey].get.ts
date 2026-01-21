import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import prisma from '../../../db'

// Get PageSEO by pageKey (returns both languages if no lang specified)
export default defineEventHandler(async (event) => {
  const pageKey = getRouterParam(event, 'pageKey')
  const query = getQuery(event)
  const lang = query.lang as 'EN' | 'AR' | undefined

  if (!pageKey) {
    throw createError({
      statusCode: 400,
      message: 'Page key is required'
    })
  }

  if (lang) {
    const pageSEO = await prisma.pageSEO.findUnique({
      where: {
        pageKey_lang: {
          pageKey,
          lang
        }
      }
    })

    if (!pageSEO) {
      throw createError({
        statusCode: 404,
        message: 'Page SEO not found'
      })
    }

    return pageSEO
  }

  // Return both languages
  const pages = await prisma.pageSEO.findMany({
    where: { pageKey },
    orderBy: { lang: 'asc' }
  })

  return {
    pageKey,
    translations: pages.reduce((acc, page) => {
      acc[page.lang] = page
      return acc
    }, {} as Record<string, typeof pages[0]>)
  }
})
