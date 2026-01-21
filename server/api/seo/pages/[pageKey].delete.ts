import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import prisma from '../../../db'

// Delete PageSEO by pageKey (with optional lang filter)
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
    // Delete specific language
    await prisma.pageSEO.delete({
      where: {
        pageKey_lang: {
          pageKey,
          lang
        }
      }
    })

    return { success: true, deleted: { pageKey, lang } }
  }

  // Delete all languages for this page
  const result = await prisma.pageSEO.deleteMany({
    where: { pageKey }
  })

  return { success: true, deleted: { pageKey, count: result.count } }
})
