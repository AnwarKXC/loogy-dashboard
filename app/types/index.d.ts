import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE'

export interface CustomerListItem {
  id: number
  name: string
  email: string
  phoneNumber: string | null
  status: CustomerStatus
  ordersCount: number
  lastSession: string
  createdAt: string
}

export interface CustomerListResponse {
  items: CustomerListItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export type OrderStatus = 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'

export interface OrderListItem {
  id: number
  orderNumber: string
  customerName: string
  status: OrderStatus
  paymentMethod: string
  totalAmount: number
  createdAt: string
}

export interface OrderListResponse {
  items: OrderListItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
  link?: string
  label?: string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export interface SuperAdminAccount {
  id: number
  email: string
  name: string | null
  role: 'OWNER' | 'MANAGER' | 'SALES'
  createdAt: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export type ProductInventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'

export interface ProductFilterOption {
  id: number
  name: string
  slug: string
}

export interface ProductListItem {
  id: number
  name: string
  slug: string
  image: string | null
  price: number
  salePrice: number | null
  discountPercentage: number | null
  rating: number | null
  quantity: number
  stock: number | null
  status: ProductInventoryStatus
  updatedAt: string
  category: ProductFilterOption | null
  brand: ProductFilterOption | null
  isArchived: boolean
}

export interface ProductListResponse {
  items: ProductListItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  filters?: {
    categories: ProductFilterOption[]
    brands: ProductFilterOption[]
  }
}

export interface ProductFiltersResponse {
  categories: CategoryTreeNode[]
  brands: ProductFilterOption[]
}

export interface ProductSeoMeta {
  title?: string
  description?: string
  canonical?: string
  keywords: string[]
}

export interface ProductDetail extends ProductListItem {
  images: string[]
  description: string | null
  shortDescription: string | null
  seo: ProductSeoMeta | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoCanonical?: string | null
  seoKeywords?: string[]
  translationsRaw?: TranslationWithSEO[]
  raw: {
    name: Record<string, unknown>
    description: Record<string, unknown> | null
    shortDescription: Record<string, unknown> | null
    seo: Record<string, unknown> | null
  }
}

export interface ProductDetailResponse {
  product: ProductDetail
}

export interface ProductEditorValues {
  nameEn: string
  nameAr: string
  slug?: string
  price: number
  salePrice: number | null
  quantity: number
  categoryId: number | null
  brandId: number | null
  descriptionEn?: string
  descriptionAr?: string
  shortDescriptionEn?: string
  shortDescriptionAr?: string
  stock?: number | null
  images: string[]
  isArchived: boolean
  // Legacy single-language SEO (kept for backward compatibility)
  seoTitle?: string
  seoDescription?: string
  seoCanonical?: string
  seoKeywords: string[]
  // Bilingual SEO fields
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  seoKeywordsEn?: string
  seoKeywordsAr?: string
  ogTitleEn?: string
  ogTitleAr?: string
  ogDescriptionEn?: string
  ogDescriptionAr?: string
  ogImageEn?: string
  ogImageAr?: string
  // Raw translations for edit mode
  translationsRaw?: TranslationWithSEO[]
}

export interface ProductBasePayload {
  nameEn: string
  nameAr: string
  price: number
  salePrice: number | null
  quantity: number
  categoryId: number | null
  brandId: number | null
}

export interface CategoryTreeNode {
  id: number
  name: string
  slug: string
  parentId: number | null
  productCount: number
  childCount: number
  translations: Record<string, string>
  translationsRaw?: TranslationWithSEO[]
  children: CategoryTreeNode[]
}

export interface CategoryListResponse {
  categories: CategoryTreeNode[]
}

export interface CategoryEditorValues {
  nameEn: string
  nameAr?: string
  descriptionEn?: string
  descriptionAr?: string
  parentId: number | null
  image?: string | null
  // SEO fields (per language)
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  seoKeywordsEn?: string
  seoKeywordsAr?: string
  ogTitleEn?: string
  ogTitleAr?: string
  ogDescriptionEn?: string
  ogDescriptionAr?: string
  ogImageEn?: string
  ogImageAr?: string
}

export interface TranslationWithSEO {
  lang: string
  name: string
  description?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
}

export interface BrandListItem {
  id: number
  name: string
  slug: string
  logo: string | null
  description: string | null
  productCount: number
  createdAt: string
  updatedAt: string
  translations: Record<string, string>
  translationsRaw?: TranslationWithSEO[]
}

export interface BrandListResponse {
  items: BrandListItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface BrandEditorValues {
  nameEn: string
  nameAr?: string
  descriptionEn?: string
  descriptionAr?: string
  logo?: string | null
  // SEO fields (per language)
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  seoKeywordsEn?: string
  seoKeywordsAr?: string
  ogTitleEn?: string
  ogTitleAr?: string
  ogDescriptionEn?: string
  ogDescriptionAr?: string
  ogImageEn?: string
  ogImageAr?: string
}
