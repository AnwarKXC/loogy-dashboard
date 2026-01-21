import { defineEventHandler } from 'h3'
import prisma from '../../../db'

// List all PageSEO entries grouped by pageKey
export default defineEventHandler(async () => {
  const pages = await prisma.pageSEO.findMany({
    orderBy: [
      { pageKey: 'asc' },
      { lang: 'asc' }
    ]
  })

  // Group by pageKey
  const grouped = pages.reduce((acc, page) => {
    if (!acc[page.pageKey]) {
      acc[page.pageKey] = {}
    }
    acc[page.pageKey][page.lang] = page
    return acc
  }, {} as Record<string, Record<string, typeof pages[0]>>)

  return {
    pages: grouped,
    total: pages.length
  }
})
