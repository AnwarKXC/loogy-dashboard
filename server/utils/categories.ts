import { prisma } from './prisma'

export type CategoryRecord = {
  id: number
  name: unknown
  slug: string
  parentId: number | null
  createdAt: Date
  _count: {
    products: number
    children: number
  }
}

export type CategoryNode = {
  id: number
  name: string
  slug: string
  parentId: number | null
  productCount: number
  childCount: number
  translations: Record<string, string>
  children: CategoryNode[]
}

export function buildCategoryTree(
  records: CategoryRecord[],
  includeProductCounts: boolean,
  getLocalizedName: (value: unknown, slug: string) => string
): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>()

  for (const record of records) {
    const translations = normalizeTranslations(record.name)

    nodes.set(record.id, {
      id: record.id,
      name: getLocalizedName(record.name, record.slug) || record.slug,
      slug: record.slug,
      parentId: record.parentId,
      productCount: includeProductCounts ? record._count.products : 0,
      childCount: record._count.children,
      translations,
      children: []
    })
  }

  const roots: CategoryNode[] = []

  for (const record of records) {
    const node = nodes.get(record.id)

    if (!node) {
      continue
    }

    if (record.parentId) {
      const parent = nodes.get(record.parentId)

      if (parent) {
        parent.children.push(node)
        continue
      }
    }

    roots.push(node)
  }

  const sortTree = (items: CategoryNode[]) => {
    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

    for (const item of items) {
      if (item.children.length > 0) {
        sortTree(item.children)
      }
    }

    return items
  }

  return sortTree(roots)
}

export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = []

  const visit = (items: CategoryNode[]) => {
    for (const item of items) {
      result.push(item)

      if (item.children.length > 0) {
        visit(item.children)
      }
    }
  }

  visit(nodes)

  return result
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

export async function generateUniqueCategorySlug(base: string, currentId?: number) {
  const baseSlug = toSlug(base) || `category-${Date.now()}`
  let candidate = baseSlug
  let attempt = 1

  while (true) {
    const existing = await prisma.category.findUnique({
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

export function createCategoryName(nameEn: string, nameAr?: string) {
  const value: Record<string, string> = {}

  if (nameEn.trim().length > 0) {
    value.en = nameEn.trim()
  }

  if (nameAr && nameAr.trim().length > 0) {
    value.ar = nameAr.trim()
  }

  return value
}

function normalizeTranslations(value: unknown) {
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
