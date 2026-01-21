import { eventHandler } from 'h3'

import prisma from '../../../db'
import { getProductInclude, getPreferredTranslation, mapProductToListItem } from '../../../utils/products'
import type { ProductWithRelations } from '../../../utils/products'

const DEFAULT_HOME_CONTENT = {
  hero: {
    title: 'NEW COLLECTION',
    subtitle: 'Shop the latest drops',
    ctaLabel: 'GO TO SHOP',
    ctaTo: '/products',
    slides: [] as Array<{ productId?: number, image?: string, image2?: string, title?: string, subtitle?: string, ctaLabel?: string, ctaTo?: string }>
  },
  sections: {
    newArrivalProductIds: [] as number[],
    collectionProductIds: [] as number[],
    egyptProductIds: [] as number[],
    previousOrderProductIds: [] as number[]
  },
  galleryImages: [] as string[],
  reviews: [] as Array<{ id: number, user: string, msg: string, time: string, avatar?: string, platform?: string }>
}

type StorefrontContent = typeof DEFAULT_HOME_CONTENT

type HomeProductItem = ReturnType<typeof mapProductToListItem>

type ProductSlot = {
  items: HomeProductItem[]
}

function normalizeContent(value: unknown): StorefrontContent {
  if (!value || typeof value !== 'object') {
    return DEFAULT_HOME_CONTENT
  }

  const data = value as StorefrontContent

  return {
    hero: {
      ...DEFAULT_HOME_CONTENT.hero,
      ...(data.hero ?? {})
    },
    sections: {
      ...DEFAULT_HOME_CONTENT.sections,
      ...(data.sections ?? {})
    },
    galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
    reviews: Array.isArray(data.reviews) ? data.reviews : []
  }
}

export default eventHandler(async () => {
  let content: { data?: unknown } | null = null

  try {
    content = await prisma.storefrontContent.findUnique({ where: { key: 'home' } })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    if (code !== 'P2021') {
      throw error
    }
  }

  const [appSettings, categories, brands] = await prisma.$transaction([
    prisma.appSettings.findFirst(),
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
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
            }
          }
        }
      },
      orderBy: [{ createdAt: 'asc' }]
    }),
    prisma.brand.findMany({
      select: {
        id: true,
        slug: true,
        logo: true,
        translations: {
          select: {
            lang: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: [{ createdAt: 'asc' }]
    })
  ])

  const resolvedContent = normalizeContent(content?.data ?? DEFAULT_HOME_CONTENT)

  const publishedFilter = { isPublished: true, isArchived: false }

  async function resolveProducts(ids: number[], fallbackTake: number, orderBy: { createdAt?: 'asc' | 'desc' } = { createdAt: 'desc' }): Promise<HomeProductItem[]> {
    const baseWhere = { ...publishedFilter }

    if (ids.length > 0) {
      const items = await prisma.product.findMany({
        where: {
          ...baseWhere,
          id: { in: ids }
        },
        include: getProductInclude()
      })

      return (items as unknown as ProductWithRelations[]).map(mapProductToListItem)
    }

    const items = await prisma.product.findMany({
      where: baseWhere,
      include: getProductInclude(),
      orderBy,
      take: fallbackTake
    })

    return (items as unknown as ProductWithRelations[]).map(mapProductToListItem)
  }

  const [newArrivals, collections, egyptProducts, previousOrders] = await Promise.all([
    resolveProducts(resolvedContent.sections.newArrivalProductIds, 4, { createdAt: 'desc' }),
    resolveProducts(resolvedContent.sections.collectionProductIds, 3, { createdAt: 'desc' }),
    resolveProducts(resolvedContent.sections.egyptProductIds, 6, { createdAt: 'desc' }),
    resolveProducts(resolvedContent.sections.previousOrderProductIds, 10, { createdAt: 'desc' })
  ])

  const heroFeaturedProducts = resolvedContent.hero.slides.length
    ? []
    : await prisma.product.findMany({
        where: {
          ...publishedFilter,
          isHeroFeatured: true
        },
        include: getProductInclude(),
        orderBy: [{ updatedAt: 'desc' }],
        take: 2
      })

  const categoryIds = categories.map((category: (typeof categories)[number]) => category.id)
  const categoryImages = await prisma.product.findMany({
    where: {
      ...publishedFilter,
      categoryId: { in: categoryIds }
    },
    select: {
      categoryId: true,
      images: true
    },
    orderBy: [{ createdAt: 'desc' }]
  })

  const imageByCategoryId = new Map<number, string>()
  for (const product of categoryImages) {
    if (!product.categoryId) continue
    if (imageByCategoryId.has(product.categoryId)) continue
    const image = product.images?.[0]
    if (image) {
      imageByCategoryId.set(product.categoryId, image)
    }
  }

  const featuredCategories = categories.slice(0, 4).map((category: (typeof categories)[number]) => ({
    id: category.id,
    slug: category.slug,
    title: getPreferredTranslation(category.translations, 'name') || category.slug,
    count: `${category._count.products} Items`,
    image: imageByCategoryId.get(category.id) ?? null,
    colSpan: 'md:col-span-1'
  }))

  const heroSlides = resolvedContent.hero.slides.length
    ? resolvedContent.hero.slides
    : heroFeaturedProducts.length
      ? (heroFeaturedProducts as unknown as ProductWithRelations[]).map(product => {
          const item = mapProductToListItem(product)
          return {
            productId: item.id,
            image: item.image ?? undefined,
            image2: item.image ?? undefined,
            title: item.name,
            subtitle: resolvedContent.hero.subtitle,
            ctaLabel: resolvedContent.hero.ctaLabel,
            ctaTo: `/products/${item.slug}`
          }
        })
      : newArrivals.slice(0, 2).map(item => ({
          productId: item.id,
          image: item.image ?? undefined,
          image2: item.image ?? undefined,
          title: item.name,
          subtitle: resolvedContent.hero.subtitle,
          ctaLabel: resolvedContent.hero.ctaLabel,
          ctaTo: `/products/${item.slug}`
        }))

  const homeHero = {
    title: resolvedContent.hero.title || appSettings?.storeName || 'NEW COLLECTION',
    subtitle: resolvedContent.hero.subtitle || appSettings?.storeDescription || 'Shop the latest drops',
    ctaLabel: resolvedContent.hero.ctaLabel,
    ctaTo: resolvedContent.hero.ctaTo,
    slides: heroSlides
  }

  return {
    hero: homeHero,
    sections: {
      newArrivals,
      collections,
      egyptProducts,
      previousOrders
    },
    categories: featuredCategories,
    galleryImages: resolvedContent.galleryImages,
    reviews: resolvedContent.reviews,
    brands: brands.map((brand: (typeof brands)[number]) => ({
      id: brand.id,
      slug: brand.slug,
      name: getPreferredTranslation(brand.translations, 'name') || brand.slug,
      logo: brand.logo ?? null,
      productCount: brand._count.products
    }))
  }
})
