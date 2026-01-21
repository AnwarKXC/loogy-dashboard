import { eventHandler } from 'h3'

import prisma from '../../../db'
import { getLocalizedString } from '../../../utils/products'
import { buildCategoryTree } from '../../../utils/categories'
import type { CategoryRecord, CategoryNode as StoreCategoryNode } from '../../../utils/categories'

const DEFAULT_CONTENT = {
  images: {} as Record<string, string>,
  featuredSlugs: [] as string[]
}

type StorefrontCategoryContent = typeof DEFAULT_CONTENT

type CategoryNode = StoreCategoryNode & {
  image?: string | null
}

function normalizeContent(value: unknown): StorefrontCategoryContent {
  if (!value || typeof value !== 'object') {
    return DEFAULT_CONTENT
  }

  const payload = value as StorefrontCategoryContent

  return {
    images: payload.images ?? {},
    featuredSlugs: Array.isArray(payload.featuredSlugs) ? payload.featuredSlugs : []
  }
}

const flattenCategories = (nodes: CategoryNode[]): CategoryNode[] =>
  nodes.flatMap(node => [node, ...(node.children.length ? flattenCategories(node.children as CategoryNode[]) : [])])

export default eventHandler(async () => {
  let content: { data?: unknown } | null = null

  try {
    content = await prisma.storefrontContent.findUnique({ where: { key: 'categories' } })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    if (code !== 'P2021') {
      throw error
    }
  }

  const [categories] = await prisma.$transaction([
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        parentId: true,
        createdAt: true,
        translations: {
          select: {
            lang: true,
            name: true
          }
        },
        _count: {
          select: {
            products: {
              where: {
                isPublished: true,
                isArchived: false
              }
            },
            children: true
          }
        }
      },
      orderBy: [{ createdAt: 'asc' }]
    })
  ])

  const normalized = categories.map((category: (typeof categories)[number]) => ({
    id: category.id,
    slug: category.slug,
    parentId: category.parentId,
    createdAt: category.createdAt,
    _count: category._count,
    name: Object.fromEntries(
      category.translations.map((translation: (typeof category.translations)[number]) => [translation.lang.toLowerCase(), translation.name])
    )
  }))

  const tree = buildCategoryTree(
    normalized as unknown as CategoryRecord[],
    true,
    (value: unknown, slug: string) => getLocalizedString(value) || slug
  )

  const resolvedContent = normalizeContent(content?.data ?? DEFAULT_CONTENT)
  const imageBySlug = resolvedContent.images ?? {}

  const attachImages = (nodes: StoreCategoryNode[]): CategoryNode[] =>
    nodes.map(node => ({
      ...node,
      image: imageBySlug[node.slug] ?? null,
      children: node.children.length ? attachImages(node.children) : []
    }))

  const categoriesWithImages = attachImages(tree)
  const flat = flattenCategories(categoriesWithImages)

  const featured = resolvedContent.featuredSlugs.length
    ? resolvedContent.featuredSlugs
        .map(slug => flat.find(node => node.slug === slug))
        .filter((node): node is CategoryNode => Boolean(node))
    : flat.slice(0, 8)

  return {
    categories: categoriesWithImages,
    featured
  }
})
