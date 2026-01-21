import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import prisma from '../../../db'

const seoSchema = z.object({
  pageKey: z.string().min(1, 'Page key is required'),
  lang: z.enum(['EN', 'AR']),
  title: z.string().max(70, 'Title must be 70 characters or less'),
  description: z.string().max(160, 'Description must be 160 characters or less').nullable().optional(),
  keywords: z.string().max(255, 'Keywords must be 255 characters or less').nullable().optional(),
  ogTitle: z.string().max(70, 'OG Title must be 70 characters or less').nullable().optional(),
  ogDescription: z.string().max(200, 'OG Description must be 200 characters or less').nullable().optional(),
  ogImage: z.string().nullable().optional(),
  canonicalUrl: z.string().url('Must be a valid URL').nullable().optional(),
  robots: z.string().nullable().optional(),
  structuredData: z.any().nullable().optional()
})

// Create or update PageSEO
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = seoSchema.parse(body)

  const pageSEO = await prisma.pageSEO.upsert({
    where: {
      pageKey_lang: {
        pageKey: data.pageKey,
        lang: data.lang
      }
    },
    update: {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      canonicalUrl: data.canonicalUrl,
      robots: data.robots,
      structuredData: data.structuredData
    },
    create: {
      pageKey: data.pageKey,
      lang: data.lang,
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      canonicalUrl: data.canonicalUrl,
      robots: data.robots,
      structuredData: data.structuredData
    }
  })

  return pageSEO
})
