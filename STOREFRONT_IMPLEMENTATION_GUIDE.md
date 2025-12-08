# E-Commerce Storefront Implementation Guide

**Project**: Loogy Dashboard - Full-Stack E-Commerce Template  
**Stack**: Nuxt 4 + Nuxt UI v4 + Prisma + PostgreSQL  
**Purpose**: Reusable e-commerce template for freelance projects  
**Date**: December 2025

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Database Schema](#database-schema)
4. [Project Structure](#project-structure)
5. [Public API Endpoints](#public-api-endpoints)
6. [Storefront Pages](#storefront-pages)
7. [Composables & State Management](#composables--state-management)
8. [Nuxt UI Components Reference](#nuxt-ui-components-reference)
9. [Paymob Payment Integration](#paymob-payment-integration)
10. [Implementation Checklist](#implementation-checklist)
11. [MCP Server Integration](#mcp-server-integration)

---

## 🎯 Project Overview

This is a **production-ready, full-stack e-commerce template** designed for **50k daily traffic**, featuring:

- **Admin Dashboard** (existing) - Product, order, customer management
- **Customer Storefront** (to implement) - Shopping experience, cart, checkout, payments
- **Real-time Chat** - Customer support via Socket.io
- **Multi-language Support** - English & Arabic (i18n ready)
- **Payment Gateway** - Paymob integration (Egypt market)
- **Image Management** - AWS S3 for product images
- **Authentication** - OAuth ready (Google, GitHub) + email/password

### Key Features to Implement

#### Homepage

- ✅ Responsive header with navigation, cart, wishlist icons
- ✅ Hero section with CTAs
- ✅ Product carousel (trending products)
- ✅ Category grid section
- ✅ Fawry deals product carousel
- ✅ Customer reviews section
- ✅ Social media links
- ✅ Footer
- ✅ Chatbot widget

#### Product Catalog

- ✅ Product listing with filters (category, brand, price)
- ✅ Search functionality
- ✅ Sorting (price, rating, newest)
- ✅ Pagination
- ✅ Product detail page with variants
- ✅ Image gallery
- ✅ Add to cart/wishlist
- ✅ Related products

#### Shopping Cart & Wishlist

- ✅ Cart management (add, update quantity, remove)
- ✅ Wishlist management
- ✅ Guest cart (localStorage)
- ✅ Authenticated cart sync
- ✅ Cart summary with pricing

#### Checkout Flow

- ✅ Multi-step checkout (shipping, payment, review)
- ✅ Address management
- ✅ Payment method selection
- ✅ Promo code application
- ✅ Order confirmation

#### Customer Account

- ✅ Login/Register
- ✅ Profile management
- ✅ Order history
- ✅ Address book
- ✅ Wishlist
- ✅ Chat history

---

## 🛠 Tech Stack & Dependencies

### Core Framework

```json
{
  "nuxt": "^4.0.0",
  "@nuxt/ui": "^4.0.1",
  "@nuxt/eslint": "latest",
  "@vueuse/nuxt": "^13.9.0"
}
```

### UI & Styling

- **Nuxt UI v4** - Complete component library
- **Tailwind CSS** - Utility-first CSS
- **Iconify** - 200k+ icons (`@iconify-json/lucide`)

### Database & ORM

```json
{
  "prisma": "^7.0.0",
  "@prisma/client": "^7.0.0"
}
```

### Authentication & Validation

```json
{
  "zod": "^4.1.11",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2"
}
```

### Payment & Services

```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "socket.io": "^4.x.x",
  "socket.io-client": "^4.x.x",
  "date-fns": "^3.x.x"
}
```

### State Management

- **VueUse** - Composition utilities
- **Pinia** (via Nuxt auto-imports)
- **localStorage** - Guest cart/wishlist

---

## 💾 Database Schema

### Core Models

#### User Model

```prisma
model User {
  id               Int      @id @default(autoincrement())
  authProviderId   String   @unique
  name             String?
  email            String   @unique
  avatar           String?
  authProvider     String?  // 'google', 'github', 'email'
  phoneNumber      String?
  isActive         Boolean  @default(true)
  role             Role     @default(CUSTOMER)
  
  addresses        Address[]
  cart             Cart?
  wishlist         Wishlist?
  orders           Order[]
  conversation     Conversation?
}
```

#### Product Model

```prisma
model Product {
  id                 Int       @id @default(autoincrement())
  slug               String    @unique
  price              Decimal   @db.Decimal(10, 2)
  salePrice          Decimal?  @db.Decimal(10, 2)
  discountPercentage Decimal?  @db.Decimal(5, 2)
  stock              Int       @default(0)
  isPublished        Boolean   @default(false)
  isArchived         Boolean   @default(false)
  images             String[]  @default([])
  rating             Decimal?  @db.Decimal(3, 2)
  
  categoryId         Int?
  brandId            Int?
  
  variants           ProductVariant[]
  translations       ProductTranslation[]
  cartItems          CartItem[]
  wishlistItems      WishlistItem[]
}
```

#### Cart & Wishlist

```prisma
model Cart {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique
  items     CartItem[]
}

model CartItem {
  id        Int      @id @default(autoincrement())
  cartId    Int
  productId Int
  variantId Int?
  quantity  Int      @default(1)
  
  @@unique([cartId, productId, variantId])
}
```

#### Order Model

```prisma
model Order {
  id              Int           @id @default(autoincrement())
  userId          Int?
  subtotal        Decimal       @db.Decimal(12, 2)
  discount        Decimal?      @db.Decimal(12, 2)
  shippingCost    Decimal       @db.Decimal(12, 2)
  totalAmount     Decimal       @db.Decimal(12, 2)
  status          OrderStatus   @default(PENDING)
  paymentMethod   PaymentMethod
  
  // Shipping address (embedded)
  customerName    String
  shippingPhone   String
  shippingStreet  String
  shippingCity    String
  shippingCountry String
  
  items           OrderItem[]
  timeline        OrderTimeline[]
}
```

### Enums

```prisma
enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPING
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentMethod {
  CASH
  VODAFONE_CASH
  INSTAPAY
  VISA
}

enum Language {
  EN
  AR
}
```

---

## 📁 Project Structure

```text
d:/dashboard/
├── app/
│   ├── pages/
│   │   ├── index.vue                      # Admin dashboard home
│   │   ├── admin/                         # Admin pages (existing)
│   │   └── (store)/                         # 🆕 STOREFRONT PAGES
│   │       ├── index.vue                  # Homepage
│   │       ├── products/
│   │       │   ├── index.vue              # Product listing
│   │       │   └── [slug].vue             # Product detail
│   │       ├── categories/
│   │       │   └── [slug].vue             # Category page
│   │       ├── cart.vue                   # Shopping cart
│   │       ├── wishlist.vue               # Wishlist
│   │       ├── checkout.vue               # Checkout flow
│   │       └── account/
│   │           ├── index.vue              # Account dashboard
│   │           ├── orders.vue             # Order history
│   │           ├── addresses.vue          # Address management
│   │           ├── profile.vue            # Profile settings
│   │           └── login.vue              # Login/Register
│   │
│   ├── layouts/
│   │   ├── default.vue                    # Admin layout (existing)
│   │   └── store.vue                      # 🆕 Storefront layout
│   │
│   ├── components/
│   │   ├── store/                         # 🆕 STOREFRONT COMPONENTS
│   │   │   ├── StoreHeader.vue            # Header with nav/cart
│   │   │   ├── StoreFooter.vue            # Footer
│   │   │   ├── HeroSection.vue            # Hero with CTA
│   │   │   ├── ProductCard.vue            # Product card
│   │   │   ├── ProductCarousel.vue        # Product carousel
│   │   │   ├── CategoryGrid.vue           # Category grid
│   │   │   ├── CustomerReviews.vue        # Reviews section
│   │   │   ├── SocialMediaLinks.vue       # Social links
│   │   │   ├── ChatWidget.vue             # Chat button
│   │   │   ├── ProductFilters.vue         # Filter sidebar
│   │   │   ├── ProductGallery.vue         # Image gallery
│   │   │   ├── VariantSelector.vue        # Variant picker
│   │   │   ├── CartDrawer.vue             # Cart slideover
│   │   │   ├── CartItem.vue               # Cart item
│   │   │   ├── CheckoutStepper.vue        # Checkout steps
│   │   │   ├── AddressForm.vue            # Address form
│   │   │   └── PaymentMethodSelector.vue  # Payment picker
│   │   │
│   │   ├── brands/                        # Admin components (existing)
│   │   ├── categories/
│   │   └── products/
│   │
│   ├── composables/
│   │   ├── useCart.ts                     # 🆕 Cart state
│   │   ├── useWishlist.ts                 # 🆕 Wishlist state
│   │   ├── useStorefront.ts               # 🆕 Public API
│   │   ├── useCustomerAuth.ts             # 🆕 Customer auth
│   │   ├── useCheckout.ts                 # 🆕 Checkout flow
│   │   ├── useChat.ts                     # Existing
│   │   └── useDashboard.ts                # Existing
│   │
│   └── utils/
│       ├── store.ts                       # 🆕 Store utilities
│       ├── currency.ts                    # 🆕 Price formatting
│       └── translations.ts                # 🆕 i18n helpers
│
├── server/
│   ├── api/
│   │   ├── public/                        # 🆕 PUBLIC API ENDPOINTS
│   │   │   ├── products/
│   │   │   │   ├── index.get.ts           # List products
│   │   │   │   ├── [slug].get.ts          # Get product
│   │   │   │   └── filters.get.ts         # Get filters
│   │   │   ├── categories/
│   │   │   │   ├── index.get.ts           # List categories
│   │   │   │   └── [slug].get.ts          # Get category
│   │   │   ├── brands/
│   │   │   │   └── index.get.ts           # List brands
│   │   │   ├── cart/
│   │   │   │   ├── index.get.ts           # Get cart
│   │   │   │   ├── index.post.ts          # Add to cart
│   │   │   │   ├── [id].patch.ts          # Update quantity
│   │   │   │   ├── [id].delete.ts         # Remove item
│   │   │   │   └── clear.delete.ts        # Clear cart
│   │   │   ├── wishlist/
│   │   │   │   ├── index.get.ts           # Get wishlist
│   │   │   │   ├── index.post.ts          # Add item
│   │   │   │   └── [id].delete.ts         # Remove item
│   │   │   ├── checkout/
│   │   │   │   ├── validate.post.ts       # Validate cart
│   │   │   │   ├── promo.post.ts          # Apply promo
│   │   │   │   ├── create-order.post.ts   # Create order
│   │   │   │   └── paymob.post.ts         # Init payment
│   │   │   ├── auth/
│   │   │   │   ├── register.post.ts       # Register
│   │   │   │   ├── login.post.ts          # Login
│   │   │   │   ├── logout.post.ts         # Logout
│   │   │   │   └── me.get.ts              # Get user
│   │   │   └── reviews/
│   │   │       ├── [productSlug].get.ts   # Get reviews
│   │   │       └── index.post.ts          # Add review
│   │   │
│   │   ├── webhooks/
│   │   │   └── paymob.post.ts             # 🆕 Paymob callback
│   │   │
│   │   ├── products.ts                    # Admin API (existing)
│   │   ├── categories.ts
│   │   └── orders.ts
│   │
│   └── utils/
│       ├── paymob.ts                      # 🆕 Paymob SDK
│       ├── customer-auth.ts               # 🆕 Customer auth
│       └── pricing.ts                     # 🆕 Price calculations
│
└── prisma/
    └── schema.prisma                      # Database schema
```

---

## 🔌 Public API Endpoints

### Products API

#### `GET /api/public/products`

List products with filters, search, pagination.

**Query Params:**

```typescript
{
  page?: number          // Default: 1
  limit?: number         // Default: 20
  categoryId?: number
  brandId?: number
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price' | 'rating' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  onSale?: boolean      // Has salePrice
  lang?: 'en' | 'ar'    // Translation language
}
```

**Response:**

```typescript
{
  products: Array<{
    id: number
    slug: string
    name: string           // Translated
    description: string    // Translated
    price: number
    salePrice?: number
    discountPercentage?: number
    images: string[]
    rating?: number
    stock: number
    category?: { id, name, slug }
    brand?: { id, name, slug }
  }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

#### `GET /api/public/products/:slug`

Get single product with variants.

**Response:**

```typescript
{
  id: number
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  salePrice?: number
  images: string[]
  rating?: number
  stock: number
  category?: { id, name, slug }
  brand?: { id, name, slug, logo }
  variants: Array<{
    id: number
    sku: string
    attributes: { color?, size?, etc }
    price: number
    salePrice?: number
    stock: number
    images: string[]
  }>
  relatedProducts: Product[]
}
```

### Cart API

#### `GET /api/public/cart`

Get user's cart (requires auth).

**Response:**

```typescript
{
  id: number
  items: Array<{
    id: number
    product: { id, slug, name, images, price }
    variant?: { id, sku, attributes, price }
    quantity: number
    subtotal: number
  }>
  summary: {
    itemCount: number
    subtotal: number
    discount: number
    shipping: number
    total: number
  }
}
```

#### `POST /api/public/cart`

Add item to cart.

**Body:**

```typescript
{
  productId: number
  variantId?: number
  quantity: number
}
```

#### `PATCH /api/public/cart/:id`

Update cart item quantity.

**Body:**

```typescript
{
  quantity: number
}
```

#### `DELETE /api/public/cart/:id`

Remove item from cart.

### Checkout API

#### `POST /api/public/checkout/validate`

Validate cart and get pricing.

**Response:**

```typescript
{
  valid: boolean
  errors?: string[]
  summary: {
    subtotal: number
    discount: number
    shipping: number
    total: number
  }
  items: CartItem[]
}
```

#### `POST /api/public/checkout/promo`

Apply promo code.

**Body:**

```typescript
{
  code: string
}
```

**Response:**

```typescript
{
  valid: boolean
  discount: number
  applicationType: 'PERCENTAGE' | 'FIXED'
  value: number
}
```

#### `POST /api/public/checkout/create-order`

Create order.

**Body:**

```typescript
{
  paymentMethod: 'CASH' | 'VODAFONE_CASH' | 'INSTAPAY' | 'VISA'
  shippingAddress: {
    name: string
    phone: string
    street: string
    city: string
    country: string
  }
  promoCode?: string
}
```

**Response:**

```typescript
{
  orderId: number
  totalAmount: number
  paymentUrl?: string  // For Paymob
}
```

### Authentication API

#### `POST /api/public/auth/register`

Register new customer.

**Body:**

```typescript
{
  name: string
  email: string
  password: string
  phoneNumber?: string
}
```

#### `POST /api/public/auth/admin/login`

Login customer.

**Body:**

```typescript
{
  email: string
  password: string
}
```

**Response:**

```typescript
{
  token: string
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}
```

---

## 📄 Storefront Pages

### 1. Homepage (`/store`)

**Layout:** `store.vue`  
**Components:**

- `StoreHeader` - Navigation, search, cart/wishlist icons
- `HeroSection` - Main hero with CTA buttons
- `ProductCarousel` - Trending/featured products
- `CategoryGrid` - Browse by category
- `ProductCarousel` - Fawry deals (products with salePrice)
- `CustomerReviews` - Customer testimonials
- `SocialMediaLinks` - Social media links
- `StoreFooter` - Footer with links
- `ChatWidget` - Floating chat button

**Data Fetching:**

```typescript
const { data: featuredProducts } = await useFetch('/api/public/products', {
  query: { sortBy: 'rating', limit: 10 }
})

const { data: deals } = await useFetch('/api/public/products', {
  query: { onSale: true, limit: 10 }
})

const { data: categories } = await useFetch('/api/public/categories')
```

### 2. Product Listing (`/store/products`)

**Components:**

- `ProductFilters` - Sidebar with filters
- `ProductCard` - Grid of products
- `Pagination` - Page navigation

**Features:**

- Filter by category, brand, price range
- Search
- Sort by price, rating, newest
- Pagination

### 3. Product Detail (`/store/products/:slug`)

**Components:**

- `ProductGallery` - Image carousel
- `VariantSelector` - Color/size picker
- `AddToCart` - Quantity + Add button
- `ProductTabs` - Description, specs, reviews
- `ProductCarousel` - Related products

**Features:**

- Variant selection
- Stock availability
- Add to cart/wishlist
- Customer reviews
- Related products

### 4. Shopping Cart (`/store/cart`)

**Components:**

- `CartItem` - Line item with quantity controls
- `CartSummary` - Pricing breakdown
- `PromoCodeInput` - Apply promo
- `CheckoutButton` - Proceed to checkout

**Features:**

- Update quantities
- Remove items
- Move to wishlist
- Apply promo codes
- View pricing breakdown

### 5. Wishlist (`/store/wishlist`)

**Components:**

- `WishlistItem` - Product card
- `AddToCartButton` - Quick add to cart

### 6. Checkout (`/store/checkout`)

**Components:**

- `CheckoutStepper` - Multi-step progress
- `AddressForm` - Shipping address
- `PaymentMethodSelector` - Payment options
- `OrderSummary` - Final review

**Steps:**

1. **Shipping** - Address form
2. **Payment** - Select payment method
3. **Review** - Confirm order
4. **Confirmation** - Order placed

### 7. Account Dashboard (`/store/account`)

**Sub-pages:**

- `/store/account` - Overview
- `/store/account/orders` - Order history
- `/store/account/addresses` - Saved addresses
- `/store/account/profile` - Edit profile
- `/store/account/wishlist` - Wishlist

### 8. Login/Register (`/store/account/admin/login`)

**Components:**

- `UAuthForm` - Nuxt UI auth form
- OAuth buttons (Google, GitHub)

---

## 🎨 Composables & State Management

### `useCart()` - Cart Management

```typescript
// app/composables/useCart.ts
export const useCart = () => {
  const cart = useState<Cart>('cart', () => null)
  const isAuthenticated = useCustomerAuth().isAuthenticated
  
  // Load cart from API or localStorage
  const loadCart = async () => {
    if (isAuthenticated.value) {
      const { data } = await useFetch('/api/public/cart')
      cart.value = data.value
    } else {
      cart.value = JSON.parse(localStorage.getItem('guestCart') || 'null')
    }
  }
  
  // Add to cart
  const addItem = async (productId: number, variantId?: number, quantity = 1) => {
    if (isAuthenticated.value) {
      await $fetch('/api/public/cart', {
        method: 'POST',
        body: { productId, variantId, quantity }
      })
      await loadCart()
    } else {
      // Update localStorage for guest
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}')
      // ... add logic
      localStorage.setItem('guestCart', JSON.stringify(guestCart))
    }
  }
  
  // Update quantity
  const updateQuantity = async (itemId: number, quantity: number) => { ... }
  
  // Remove item
  const removeItem = async (itemId: number) => { ... }
  
  // Clear cart
  const clearCart = async () => { ... }
  
  // Computed
  const itemCount = computed(() => cart.value?.items.length || 0)
  const subtotal = computed(() => cart.value?.summary.subtotal || 0)
  
  return {
    cart,
    loadCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal
  }
}
```

### `useWishlist()` - Wishlist Management

```typescript
// Similar to useCart
export const useWishlist = () => {
  const wishlist = useState<Wishlist>('wishlist', () => null)
  
  const addItem = async (productId: number, variantId?: number) => { ... }
  const removeItem = async (itemId: number) => { ... }
  const isInWishlist = (productId: number, variantId?: number) => { ... }
  
  return { wishlist, addItem, removeItem, isInWishlist }
}
```

### `useCustomerAuth()` - Customer Authentication

```typescript
// app/composables/useCustomerAuth.ts
export const useCustomerAuth = () => {
  const user = useState<User | null>('customerUser', () => null)
  const token = useCookie('customerToken')
  
  const isAuthenticated = computed(() => !!user.value)
  
  const login = async (email: string, password: string) => {
    const { data } = await $fetch('/api/public/auth/admin/login', {
      method: 'POST',
      body: { email, password }
    })
    token.value = data.token
    user.value = data.user
  }
  
  const register = async (name: string, email: string, password: string) => { ... }
  
  const logout = async () => {
    await $fetch('/api/public/auth/logout', { method: 'POST' })
    token.value = null
    user.value = null
  }
  
  const loadUser = async () => {
    if (token.value) {
      const { data } = await $fetch('/api/public/auth/me')
      user.value = data
    }
  }
  
  return { user, isAuthenticated, login, register, logout, loadUser }
}
```

### `useCheckout()` - Checkout Flow

```typescript
// app/composables/useCheckout.ts
export const useCheckout = () => {
  const step = ref(1)
  const shippingAddress = ref(null)
  const paymentMethod = ref<PaymentMethod>('CASH')
  const promoCode = ref('')
  
  const validateCart = async () => {
    return await $fetch('/api/public/checkout/validate')
  }
  
  const applyPromo = async (code: string) => {
    return await $fetch('/api/public/checkout/promo', {
      method: 'POST',
      body: { code }
    })
  }
  
  const createOrder = async () => {
    return await $fetch('/api/public/checkout/create-order', {
      method: 'POST',
      body: {
        paymentMethod: paymentMethod.value,
        shippingAddress: shippingAddress.value,
        promoCode: promoCode.value
      }
    })
  }
  
  return {
    step,
    shippingAddress,
    paymentMethod,
    promoCode,
    validateCart,
    applyPromo,
    createOrder
  }
}
```

---

## 🎨 Nuxt UI Components Reference

### Layout Components

#### `UHeader` - Storefront Header

```vue
<UHeader>
  <template #title>
    <NuxtLink to="/store">
      <img src="/logo.svg" alt="Logo" class="h-8" />
    </NuxtLink>
  </template>
  
  <UNavigationMenu :items="navItems" />
  
  <template #right>
    <UButton icon="i-lucide-search" variant="ghost" />
    <UButton icon="i-lucide-heart" variant="ghost" :badge="wishlistCount" />
    <UButton icon="i-lucide-shopping-cart" variant="ghost" :badge="cartCount" />
    <UButton v-if="!isAuthenticated" to="/store/account/admin/login">
      Login
    </UButton>
    <UDropdownMenu v-else :items="accountMenu">
      <UAvatar :src="user.avatar" />
    </UDropdownMenu>
  </template>
</UHeader>
```

#### `UFooter` - Storefront Footer

```vue
<UFooter>
  <template #top>
    <UFooterColumns :items="footerLinks" />
  </template>
  
  <template #left>
    <p class="text-sm text-muted">
      © {{ new Date().getFullYear() }} Loogy. All rights reserved.
    </p>
  </template>
  
  <template #right>
    <UButton icon="i-simple-icons-facebook" variant="ghost" />
    <UButton icon="i-simple-icons-instagram" variant="ghost" />
    <UButton icon="i-simple-icons-twitter" variant="ghost" />
  </template>
</UFooter>
```

### Product Components

#### `UCarousel` - Product Carousel

```vue
<UCarousel
  v-slot="{ item }"
  :items="products"
  :ui="{ item: 'basis-1/4' }"
  arrows
  dots
  auto-scroll
>
  <ProductCard :product="item" />
</UCarousel>
```

#### `UCard` - Product Card

```vue
<UCard variant="subtle" class="group hover:shadow-lg transition">
  <img :src="product.images[0]" class="aspect-square object-cover rounded" />
  
  <template #header>
    <h3 class="font-semibold truncate">{{ product.name }}</h3>
    <div class="flex items-center gap-1">
      <span v-if="product.salePrice" class="font-bold text-primary">
        {{ formatPrice(product.salePrice) }}
      </span>
      <span :class="product.salePrice ? 'line-through text-muted text-sm' : 'font-bold'">
        {{ formatPrice(product.price) }}
      </span>
    </div>
  </template>
  
  <template #footer>
    <UButton block @click="addToCart(product.id)">
      Add to Cart
    </UButton>
  </template>
</UCard>
```

### Form Components

#### `UAuthForm` - Login/Register

```vue
<UAuthForm
  :schema="loginSchema"
  :fields="loginFields"
  :providers="oauthProviders"
  title="Welcome back"
  description="Sign in to your account"
  @submit="handleLogin"
>
  <template #footer>
    Don't have an account? 
    <ULink to="/store/account/register" class="text-primary">
      Sign up
    </ULink>
  </template>
</UAuthForm>
```

#### `UStepper` - Checkout Steps

```vue
<UStepper
  v-model="checkoutStep"
  :items="[
    { title: 'Shipping', icon: 'i-lucide-truck' },
    { title: 'Payment', icon: 'i-lucide-credit-card' },
    { title: 'Review', icon: 'i-lucide-check-circle' }
  ]"
>
  <template #content="{ item }">
    <AddressForm v-if="item.title === 'Shipping'" />
    <PaymentMethodSelector v-else-if="item.title === 'Payment'" />
    <OrderSummary v-else />
  </template>
</UStepper>
```

### Navigation Components

#### `UNavigationMenu` - Header Navigation

```vue
<UNavigationMenu
  :items="[
    { label: 'Home', to: '/store' },
    { label: 'Products', to: '/store/products' },
    { label: 'Categories', to: '/store/categories' },
    { label: 'Deals', to: '/store/products?onSale=true' }
  ]"
/>
```

#### `UBreadcrumb` - Page Breadcrumb

```vue
<UBreadcrumb
  :items="[
    { label: 'Home', to: '/store' },
    { label: 'Products', to: '/store/products' },
    { label: product.name }
  ]"
/>
```

### Data Display

#### `UPageHero` - Homepage Hero

```vue
<UPageHero
  title="Welcome to Loogy"
  description="Discover amazing products at unbeatable prices"
  :links="[
    { label: 'Shop Now', to: '/store/products', size: 'xl' },
    { label: 'Learn More', variant: 'outline', size: 'xl' }
  ]"
  orientation="horizontal"
>
  <img src="/hero-image.jpg" class="rounded-lg shadow-2xl" />
</UPageHero>
```

#### `UTable` - Order History

```vue
<UTable
  :columns="[
    { key: 'id', label: 'Order #' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'actions' }
  ]"
  :rows="orders"
>
  <template #status-data="{ row }">
    <UBadge :color="getStatusColor(row.status)">
      {{ row.status }}
    </UBadge>
  </template>
</UTable>
```

### Overlay Components

#### `UDrawer` - Cart Drawer

```vue
<UDrawer v-model="isCartOpen" side="right">
  <template #content>
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-bold">Shopping Cart</h2>
      
      <div v-for="item in cart.items" :key="item.id">
        <CartItem :item="item" @remove="removeItem" />
      </div>
      
      <UButton block @click="navigateTo('/store/checkout')">
        Checkout - {{ formatPrice(cart.total) }}
      </UButton>
    </div>
  </template>
</UDrawer>
```

#### `UChatPalette` - Chat Widget

```vue
<UModal v-model="isChatOpen">
  <template #content>
    <UChatPalette>
      <UChatMessages :messages="messages" />
      
      <template #prompt>
        <UChatPrompt v-model="message" @submit="sendMessage" />
      </template>
    </UChatPalette>
  </template>
</UModal>
```

---

## 💳 Paymob Payment Integration

### Overview

**Paymob** is Egypt's leading payment gateway supporting:

- Credit/Debit cards (Visa, Mastercard, Meeza)
- Mobile wallets (Vodafone Cash, etc.)
- Installments
- Valu (buy now, pay later)

### Setup

#### 1. Environment Variables

```env
# .env
PAYMOB_API_KEY=your_api_key
PAYMOB_INTEGRATION_ID_CARD=your_card_integration_id
PAYMOB_INTEGRATION_ID_WALLET=your_wallet_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret
```

#### 2. Paymob SDK Utility

```typescript
// server/utils/paymob.ts
import crypto from 'crypto'

interface PaymobConfig {
  apiKey: string
  integrationIdCard: string
  integrationIdWallet: string
  iframeId: string
  hmacSecret: string
}

class PaymobSDK {
  private config: PaymobConfig
  private baseUrl = 'https://accept.paymob.com/api'
  
  constructor(config: PaymobConfig) {
    this.config = config
  }
  
  // Step 1: Get authentication token
  async getAuthToken(): Promise<string> {
    const response = await $fetch(`${this.baseUrl}/auth/tokens`, {
      method: 'POST',
      body: {
        api_key: this.config.apiKey
      }
    })
    return response.token
  }
  
  // Step 2: Create order
  async createOrder(authToken: string, amountCents: number): Promise<number> {
    const response = await $fetch(`${this.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      body: {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP'
      }
    })
    return response.id
  }
  
  // Step 3: Get payment key
  async getPaymentKey(
    authToken: string,
    orderId: number,
    amountCents: number,
    billingData: BillingData
  ): Promise<string> {
    const response = await $fetch(`${this.baseUrl}/acceptance/payment_keys`, {
      method: 'POST',
      body: {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: this.config.integrationIdCard
      }
    })
    return response.token
  }
  
  // Generate payment URL
  getPaymentUrl(paymentToken: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentToken}`
  }
  
  // Verify webhook HMAC
  verifyWebhook(data: any, receivedHmac: string): boolean {
    const concatenatedString = [
      data.amount_cents,
      data.created_at,
      data.currency,
      data.error_occured,
      data.has_parent_transaction,
      data.id,
      data.integration_id,
      data.is_3d_secure,
      data.is_auth,
      data.is_capture,
      data.is_refunded,
      data.is_standalone_payment,
      data.is_voided,
      data.order,
      data.owner,
      data.pending,
      data.source_data_pan,
      data.source_data_sub_type,
      data.source_data_type,
      data.success
    ].join('')
    
    const calculatedHmac = crypto
      .createHmac('sha512', this.config.hmacSecret)
      .update(concatenatedString)
      .digest('hex')
    
    return calculatedHmac === receivedHmac
  }
}

export const paymob = new PaymobSDK({
  apiKey: process.env.PAYMOB_API_KEY!,
  integrationIdCard: process.env.PAYMOB_INTEGRATION_ID_CARD!,
  integrationIdWallet: process.env.PAYMOB_INTEGRATION_ID_WALLET!,
  iframeId: process.env.PAYMOB_IFRAME_ID!,
  hmacSecret: process.env.PAYMOB_HMAC_SECRET!
})
```

#### 3. Initiate Payment Endpoint

```typescript
// server/api/public/checkout/paymob.post.ts
import { z } from 'zod'
import { paymob } from '~/server/utils/paymob'

const schema = z.object({
  orderId: z.number(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  
  // Get order from database
  const order = await db.order.findUnique({
    where: { id: body.orderId }
  })
  
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }
  
  // Amount in cents
  const amountCents = Math.round(order.totalAmount * 100)
  
  // Step 1: Get auth token
  const authToken = await paymob.getAuthToken()
  
  // Step 2: Create Paymob order
  const paymobOrderId = await paymob.createOrder(authToken, amountCents)
  
  // Step 3: Get payment key
  const paymentToken = await paymob.getPaymentKey(
    authToken,
    paymobOrderId,
    amountCents,
    {
      first_name: body.customerName.split(' ')[0] || body.customerName,
      last_name: body.customerName.split(' ')[1] || '',
      email: body.customerEmail,
      phone_number: body.customerPhone,
      apartment: 'NA',
      floor: 'NA',
      street: order.shippingStreet,
      building: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: order.shippingCity,
      country: order.shippingCountry,
      state: 'NA'
    }
  )
  
  // Step 4: Generate payment URL
  const paymentUrl = paymob.getPaymentUrl(paymentToken)
  
  // Save Paymob order ID to database
  await db.order.update({
    where: { id: order.id },
    data: {
      paymobOrderId,
      paymobPaymentToken: paymentToken
    }
  })
  
  return {
    paymentUrl,
    paymobOrderId
  }
})
```

#### 4. Webhook Handler

```typescript
// server/api/webhooks/paymob.post.ts
import { paymob } from '~/server/utils/paymob'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)
  
  // Verify HMAC signature
  const isValid = paymob.verifyWebhook(body.obj, query.hmac as string)
  
  if (!isValid) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }
  
  const transaction = body.obj
  
  // Find order by Paymob order ID
  const order = await db.order.findFirst({
    where: { paymobOrderId: transaction.order }
  })
  
  if (!order) {
    console.error('Order not found for Paymob order:', transaction.order)
    return { received: true }
  }
  
  // Update order status based on payment
  if (transaction.success === true) {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        paidAt: new Date(),
        paymobTransactionId: transaction.id
      }
    })
    
    // Add timeline entry
    await db.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'PROCESSING',
        note: `Payment successful. Paymob transaction: ${transaction.id}`
      }
    })
    
    // Send confirmation email/notification
    // ...
  } else {
    // Payment failed
    await db.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        note: `Payment failed: ${transaction.error_occured ? 'Error occurred' : 'Unknown error'}`
      }
    })
  }
  
  return { received: true }
})
```

### Frontend Integration

```vue
<!-- Checkout page -->
<script setup lang="ts">
const checkout = useCheckout()
const { user } = useCustomerAuth()

const handlePayment = async () => {
  // Create order first
  const order = await checkout.createOrder()
  
  if (checkout.paymentMethod === 'VISA') {
    // Redirect to Paymob
    const { paymentUrl } = await $fetch('/api/public/checkout/paymob', {
      method: 'POST',
      body: {
        orderId: order.orderId,
        customerName: user.value.name,
        customerEmail: user.value.email,
        customerPhone: user.value.phoneNumber
      }
    })
    
    // Redirect to Paymob iframe
    window.location.href = paymentUrl
  } else {
    // COD or other methods
    navigateTo(`/store/account/orders/${order.orderId}`)
  }
}
</script>
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1)

- [x] **Create storefront layout** (`app/layouts/storefront.vue`) — pages use layout meta, no `/store` prefix
- [x] **Build core components**
  - [x] StoreHeader with navigation
  - [x] StoreFooter
  - [x] ProductCard
  - [x] Category grid
- [ ] **Setup public API structure**
  - [ ] Create `/server/api/public/` folder
  - [ ] Products endpoints (list, detail)
  - [ ] Categories endpoints
  - [ ] Brands endpoints

### Phase 2: Product Catalog (Week 1-2)

- [x] **Homepage**
  - [x] Hero section
  - [x] Featured products carousel
  - [x] Category grid
  - [x] Deals section
  - [x] Customer reviews
- [ ] **Product Listing**
  - [ ] Filter sidebar (placeholder filter buttons only)
  - [x] Product grid (static sample, pagination TBD)
  - [ ] Search functionality
  - [ ] Sort options
- [ ] **Product Detail**
  - [x] Image gallery
  - [ ] Variant selector
  - [ ] Add to cart/wishlist actions wired
  - [ ] Product tabs (description, reviews)
  - [x] Related products placeholder

### Phase 3: Cart & Wishlist (Week 2)

- [x] **Cart composable** (`useCart()`)
  - [ ] Guest cart (localStorage)
  - [ ] Authenticated cart (API)
  - [ ] Cart sync on login
- [x] **Wishlist composable** (`useWishlist()`)
- [ ] **Cart API endpoints**
  - [ ] GET, POST, PATCH, DELETE
- [ ] **Wishlist API endpoints**
- [ ] **Cart page**
  - [ ] Cart items list
  - [ ] Quantity controls
  - [ ] Promo code input
  - [ ] Price summary
- [ ] **Cart drawer** (slideover)

### Phase 4: Authentication (Week 2-3)

- [ ] **Customer auth composable** (`useCustomerAuth()`)
- [ ] **Auth API endpoints**
  - [ ] Register
  - [ ] Login
  - [ ] Logout
  - [ ] Get user
- [ ] **Login/Register page**
  - [ ] UAuthForm integration
  - [ ] OAuth providers (Google, GitHub)
- [ ] **Account pages**
  - [ ] Dashboard
  - [ ] Profile editing
  - [ ] Address management
  - [ ] Order history

### Phase 5: Checkout & Payments (Week 3)

- [ ] **Checkout composable** (`useCheckout()`)
- [ ] **Checkout API endpoints**
  - [ ] Validate cart
  - [ ] Apply promo
  - [ ] Create order
- [ ] **Checkout page**
  - [ ] Multi-step stepper
  - [ ] Address form
  - [ ] Payment method selector
  - [ ] Order summary
- [ ] **Paymob integration**
  - [ ] Setup environment variables
  - [ ] Create Paymob SDK utility
  - [ ] Payment initiation endpoint
  - [ ] Webhook handler
  - [ ] Order status updates

### Phase 6: Polish & Features (Week 4)

- [ ] **Chat widget integration**
  - [ ] Floating chat button
  - [ ] Chat modal/drawer
  - [ ] Socket.io integration
- [ ] **Product reviews**
  - [ ] Review submission
  - [ ] Review display
  - [ ] Rating calculation
- [ ] **Social media integration**
  - [ ] Social links in footer
  - [ ] Share buttons on products
- [ ] **i18n support**
  - [ ] Translation utilities
  - [ ] Language switcher
  - [ ] RTL support for Arabic
- [ ] **SEO optimization**
  - [ ] Meta tags
  - [ ] Structured data
  - [ ] Sitemap
- [ ] **Performance optimization**
  - [ ] Image optimization
  - [ ] Lazy loading
  - [ ] Code splitting

### Phase 7: Testing & Deployment

- [ ] **Testing**
  - [ ] Cart flow testing
  - [ ] Checkout flow testing
  - [ ] Payment testing (sandbox)
  - [ ] Guest vs authenticated flows
- [ ] **Documentation**
  - [ ] API documentation
  - [ ] Component documentation
  - [ ] Deployment guide
- [ ] **Deployment**
  - [ ] Environment setup
  - [ ] Database migrations
  - [ ] SSL certificates
  - [ ] Payment gateway production setup

---

## 🔌 MCP Server Integration

This project leverages **Model Context Protocol (MCP)** servers for enhanced development:

### Available MCP Servers

#### 1. **Nuxt UI MCP Server**

Access Nuxt UI v4 component documentation and examples.

**Functions:**

- `mcp_nuxt-ui_get-component` - Get component docs
- `mcp_nuxt-ui_list-components` - List all components
- `mcp_nuxt-ui_get-component-metadata` - Get props/slots/emits
- `mcp_nuxt-ui_list-getting-started-guides` - Installation guides

**Usage Example:**

```typescript
// Get Carousel component documentation
const carouselDocs = await mcp_nuxt_ui_get_component('Carousel')

// List all available components
const allComponents = await mcp_nuxt_ui_list_components()
```

#### 2. **Nuxt MCP Server** (by @antfu)

Search Nuxt documentation and modules.

**Functions:**

- `mcp_antfu_nuxt-mc_search_nuxt_docs` - Search Nuxt docs
- `mcp_antfu_nuxt-mc_list_nuxt_modules` - List Nuxt modules

#### 3. **Prisma MCP Server**

Prisma database operations and migrations.

**Functions:**

- `prisma-migrate-dev` - Run migrations in dev
- `prisma-migrate-status` - Check migration status
- `prisma-migrate-reset` - Reset database
- `prisma-postgres-create-database` - Create Prisma Postgres DB

**Usage Example:**

```typescript
// Run migrations
await prisma_migrate_dev({ projectCwd: '/d/dashboard' })

// Check migration status
const status = await prisma_migrate_status({ projectCwd: '/d/dashboard' })
```

#### 4. **ByteRover MCP Server**

Knowledge storage and retrieval for project context.

**Functions:**

- `mcp_byterover_store_knowledge` - Store implementation patterns
- `mcp_byterover_retrieve_knowledge` - Retrieve relevant context

**Usage Example:**

```typescript
// Store knowledge about cart implementation
await mcp_byterover_store_knowledge({
  messages: "Cart management uses localStorage for guests and API for authenticated users. Cart syncs on login via mergeGuestCart utility."
})

// Retrieve knowledge
const context = await mcp_byterover_retrieve_knowledge({
  query: "cart implementation pattern",
  limit: 3
})
```

### MCP Best Practices

1. **Component Development**: Always check Nuxt UI MCP for component APIs before implementation
2. **Database Changes**: Use Prisma MCP for migration management
3. **Knowledge Sharing**: Store complex patterns in ByteRover MCP for team consistency
4. **Documentation**: Retrieve docs via MCP instead of external searches

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Setup database
pnpm prisma generate
pnpm prisma migrate dev

# Run development server
pnpm dev

# Build for production
pnpm build

# Run migrations in production
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

---

## 📚 Additional Resources

### Documentation

- [Nuxt 4 Docs](https://nuxt.com/docs)
- [Nuxt UI v4 Docs](https://ui.nuxt.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Paymob API Docs](https://docs.paymob.com)

### Component Libraries

- [Nuxt UI Components](https://ui.nuxt.com/docs/components)
- [Iconify Icon Sets](https://iconify.design)
- [TailwindCSS](https://tailwindcss.com/docs)

### Tools

- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Nuxt DevTools](https://devtools.nuxt.com) - Nuxt debugging

---

## 🎯 Essential E-Commerce Pages Summary

### Customer-Facing Pages

1. ✅ **Homepage** - Hero, featured products, categories, deals, reviews
2. ✅ **Product Listing** - Browse with filters, search, sort
3. ✅ **Product Detail** - Variants, images, reviews, add to cart
4. ✅ **Shopping Cart** - Manage items, apply promos, checkout
5. ✅ **Wishlist** - Save favorites, quick add to cart
6. ✅ **Checkout** - Multi-step: shipping, payment, confirmation
7. ✅ **Login/Register** - Auth with OAuth support
8. ✅ **Account Dashboard** - Overview, quick links
9. ✅ **Order History** - Track orders, reorder
10. ✅ **Order Detail** - View single order, download invoice
11. ✅ **Profile Settings** - Edit personal info
12. ✅ **Address Book** - Manage shipping addresses
13. ✅ **Search Results** - Global product search
14. ✅ **Category Pages** - Browse by category
15. ✅ **Brand Pages** - Browse by brand (optional)
16. ✅ **About Us** - Company info (static page)
17. ✅ **Contact Us** - Contact form + chat
18. ✅ **Terms & Conditions** - Legal (static)
19. ✅ **Privacy Policy** - Legal (static)
20. ✅ **FAQ** - Common questions (static)

### Nice-to-Have Pages

- **Compare Products** - Side-by-side comparison
- **Recently Viewed** - Product history
- **Gift Cards** - Purchase gift cards
- **Blog** - Content marketing
- **Store Locator** - Physical locations

---

## 📝 Notes for Developers

### Guest vs Authenticated Flow

- **Guest**: Cart/wishlist in `localStorage`, converted on login
- **Authenticated**: Real-time sync with database
- **Cart Merge**: On login, merge guest cart items into user cart

### i18n Strategy

- Product/category names stored in `ProductTranslation`/`CategoryTranslation` tables
- UI translations via Nuxt i18n module
- Language switcher in header
- RTL layout support for Arabic

### Performance Considerations

- Use Nuxt `useFetch` with caching for product lists
- Lazy load images with `<NuxtImg>`
- Paginate product listings (20-50 items per page)
- Index database properly (see schema indexes)
- Use CDN for product images (S3)

### Security

- Validate all user inputs with Zod
- Use CSRF protection for forms
- Rate limit API endpoints
- Sanitize user-generated content (reviews)
- Verify Paymob webhooks with HMAC

---

**Last Updated**: December 5, 2025  
**Version**: 1.0.0  
**Maintained By**: Development Team
