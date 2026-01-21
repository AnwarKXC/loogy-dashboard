import { eventHandler, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'

import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { generateUniqueBrandSlug } from '../../utils/brands'

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

const createBrandSchema = z.object({
  nameEn: z.string().trim().min(1, 'Brand name (English) is required'),
  nameAr: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  logo: z.string().url().optional().nullable(),
  // SEO fields
  seoTitleEn: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  seoTitleAr: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  seoDescriptionEn: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH).optional(),
  seoDescriptionAr: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH).optional(),
  seoKeywordsEn: z.string().trim().optional(),
  seoKeywordsAr: z.string().trim().optional(),
  ogTitleEn: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  ogTitleAr: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  ogDescriptionEn: z.string().trim().max(200).optional(),
  ogDescriptionAr: z.string().trim().max(200).optional()
})

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  const body = await readBody(event)
  const payload = createBrandSchema.parse(body)

  const slug = await generateUniqueBrandSlug(payload.nameEn)

  const brand = await prisma.brand.create({
    data: {
      slug,
      logo: payload.logo ?? null,
      translations: {
        createMany: {
          data: [
            {
              lang: 'EN',
              name: payload.nameEn,
              description: payload.descriptionEn ?? null,
              metaTitle: payload.seoTitleEn ?? null,
              metaDescription: payload.seoDescriptionEn ?? null,
              metaKeywords: payload.seoKeywordsEn ?? null,
              ogTitle: payload.ogTitleEn ?? null,
              ogDescription: payload.ogDescriptionEn ?? null
            },
            ...(payload.nameAr
              ? [{
                  lang: 'AR' as const,
                  name: payload.nameAr,
                  description: payload.descriptionAr ?? null,
                  metaTitle: payload.seoTitleAr ?? null,
                  metaDescription: payload.seoDescriptionAr ?? null,
                  metaKeywords: payload.seoKeywordsAr ?? null,
                  ogTitle: payload.ogTitleAr ?? null,
                  ogDescription: payload.ogDescriptionAr ?? null
                }]
              : [])
          ]
        }
      }
    },
    include: {
      translations: true,
      _count: {
        select: { products: true }
      }
    }
  })

  const enTranslation = brand.translations.find(t => t.lang === 'EN')

  setResponseStatus(event, 201)

  return {
    brand: {
      id: brand.id,
      name: enTranslation?.name ?? brand.slug,
      slug: brand.slug,
      logo: brand.logo,
      productCount: brand._count.products,
      translations: brand.translations
    }
  }
})
