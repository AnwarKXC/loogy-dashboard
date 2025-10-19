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

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
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
  seoTitle?: string
  seoDescription?: string
  seoCanonical?: string
  seoKeywords: string[]
}

export interface CategoryTreeNode {
  id: number
  name: string
  slug: string
  parentId: number | null
  productCount: number
  childCount: number
  translations: Record<string, string>
  children: CategoryTreeNode[]
}

export interface CategoryListResponse {
  categories: CategoryTreeNode[]
}

export interface CategoryEditorValues {
  nameEn: string
  nameAr?: string
  parentId: number | null
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
  logo?: string | null
}
