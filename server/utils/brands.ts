import { prisma } from './prisma'

export type BrandRecord = {
  id: number
  name: unknown
  slug: string
  logo: string | null
  description: unknown
  createdAt: Date
  updatedAt: Date
  _count: {
    products: number
  }
}

export type BrandListItem = {
  id: number
  name: string
  slug: string
  logo: string | null
  description: string | null
  productCount: number
  createdAt: string
  updatedAt: string
  translations: Record<string, string>
}

function toSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export async function generateUniqueBrandSlug(base: string, currentId?: number) {
  const baseSlug = toSlug(base) || `brand-${Date.now()}`
  let candidate = baseSlug
  let attempt = 1

  while (true) {
    const existing = await prisma.brand.findUnique({
      where: { slug: candidate },
      select: { id: true }
    })

    if (!existing || (currentId && existing.id === currentId)) {
      return candidate
    }

    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }
}

export function createBrandName(nameEn: string, nameAr?: string) {
  const value: Record<string, string> = {}

  if (nameEn.trim().length > 0) {
    value.en = nameEn.trim()
  }

  if (nameAr && nameAr.trim().length > 0) {
    value.ar = nameAr.trim()
  }

  return value
}

export function normalizeTranslations(value: unknown) {
  const translations: Record<string, string> = {}

  if (value && typeof value === 'object') {
    for (const [key, candidate] of Object.entries(value as Record<string, unknown>)) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        translations[key] = candidate.trim()
      }
    }
  }

  return translations
}

export function mapBrandRecord(record: BrandRecord, getLocalizedName: (value: unknown, slug: string) => string): BrandListItem {
  return {
    id: record.id,
    name: getLocalizedName(record.name, record.slug) || record.slug,
    slug: record.slug,
    logo: record.logo,
    description: typeof record.description === 'string' ? record.description : null,
    productCount: record._count.products,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    translations: normalizeTranslations(record.name)
  }
}
