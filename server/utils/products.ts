import type { Prisma, Product } from '~/generated/prisma'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
} satisfies Prisma.ProductInclude

type PrismaProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude
}>

export type ProductWithRelations = PrismaProductWithRelations & {
  isArchived: boolean
}

export function getProductInclude() {
  return productInclude
}

export function getLocalizedString(jsonValue: unknown, fallback = 'en'): string {
  if (!jsonValue || typeof jsonValue !== 'object') {
    return ''
  }

  const record = jsonValue as Record<string, unknown>
  const localized = record[fallback]

  if (typeof localized === 'string' && localized.trim().length > 0) {
    return localized
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return ''
}

export function getInventoryStatus(quantity: number, stock: Product['stock']): InventoryStatus {
  const available = typeof stock === 'number' ? stock : quantity

  if (available <= 0) {
    return 'out_of_stock'
  }

  if (available <= 5) {
    return 'low_stock'
  }

  return 'in_stock'
}

export function getProductInventoryStatus(product: ProductWithRelations): InventoryStatus {
  if (product.isArchived) {
    return 'archived'
  }

  return getInventoryStatus(product.quantity, product.stock)
}

export function mapProductToListItem(product: ProductWithRelations) {
  const price = product.price.toNumber()
  const salePrice = product.salePrice?.toNumber() ?? null
  const discountPercentage = product.discountPercentage?.toNumber() ?? null
  const rating = product.rating?.toNumber() ?? null

  return {
    id: product.id,
    name: getLocalizedString(product.name),
    slug: product.slug,
    image: product.images[0] ?? null,
    price,
    salePrice,
    discountPercentage,
    rating,
    quantity: product.quantity,
    stock: product.stock,
    status: getProductInventoryStatus(product),
    updatedAt: product.updatedAt.toISOString(),
    category: product.category
      ? {
          id: product.category.id,
          name: getLocalizedString(product.category.name),
          slug: product.category.slug
        }
      : null,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: getLocalizedString(product.brand.name),
          slug: product.brand.slug
        }
      : null,
    isArchived: product.isArchived
  }
}

export function mapProductToDetail(product: ProductWithRelations) {
  const listItem = mapProductToListItem(product)

  return {
    ...listItem,
    images: product.images,
    description: getLocalizedString(product.description),
    shortDescription: getLocalizedString(product.shortDescription),
    raw: {
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription
    }
  }
}
