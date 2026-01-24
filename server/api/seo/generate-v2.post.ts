import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { generateSeoContent, type GenerationTarget } from '../../utils/ai-seo'

const requestSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  nameAr: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  shortDescriptionAr: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  price: z.number().optional(),
  images: z.array(z.string()).optional(),
  target: z.enum([
    'title',
    'description',
    'keywords',
    'all',
    'descriptionEn',
    'descriptionAr',
    'shortDescriptionEn',
    'shortDescriptionAr',
    'descriptions',
    'shortDescriptions',
    'bilingualSeo'
  ]).default('all')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map(i => i.message).join(', ')
    })
  }

  const { target, ...context } = parsed.data

  try {
    const result = await generateSeoContent(context, target as GenerationTarget)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('SEO generation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate SEO content'
    })
  }
})
