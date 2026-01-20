# Turkey Store UI Implementation Guide

> Reference: https://www.turkeystore.online/
> 
> This document outlines all pages, sections, components, and their endpoint mappings for implementing a similar e-commerce storefront UI with full **light and dark mode support**.

---

## 📑 Table of Contents

1. [Page Structure Overview](#page-structure-overview)
2. [Homepage Sections](#homepage-sections)
3. [Category Pages](#category-pages)
4. [Product Pages](#product-pages)
5. [Cart & Checkout](#cart--checkout)
6. [Static Pages](#static-pages)
7. [Component Checklist](#component-checklist)
8. [Endpoint Mapping](#endpoint-mapping)
9. [Dark/Light Mode Requirements](#darklight-mode-requirements)

---

## 📄 Page Structure Overview

| Page | Route | Status | Existing Endpoint |
|------|-------|--------|-------------------|
| Homepage | `/` | ✅ Exists | `/api/public/products`, `/api/public/categories` |
| Products List | `/products` | ✅ Exists | `/api/public/products` |
| Product Detail | `/products/[slug]` | ✅ Exists | `/api/public/products/[slug]` |
| Categories List | `/categories` | ✅ Exists | `/api/public/categories` |
| Category Detail | `/categories/[slug]` | ✅ Exists | `/api/public/categories/[slug]` |
| Cart | `/cart` | ✅ Exists | Client-side (localStorage) |
| Wishlist | `/wishlist` | ✅ Exists | Client-side (localStorage) |
| Checkout | `/checkout` | ✅ Exists | `/api/orders` (to create) |
| Search | `/search` | ⚠️ Needs Creation | `/api/public/products?search=` |
| Privacy Policy | `/pages/privacy-policy` | ⚠️ Needs Creation | Static Content |
| Refund Policy | `/pages/refund-policy` | ⚠️ Needs Creation | Static Content |
| Terms & Conditions | `/pages/terms-and-conditions` | ⚠️ Needs Creation | Static Content |
| Shipping Policy | `/pages/shipping-policy` | ⚠️ Needs Creation | Static Content |

---

## 🏠 Homepage Sections

Based on Turkey Store structure, the homepage has these sections (top to bottom):

### 1. Header (StoreHeader.vue) ✅ EXISTS
**Turkey Store Features:**
- Logo (left)
- Navigation links (hidden on mobile)
- Search icon
- Theme toggle (light/dark)
- Wishlist icon with badge
- Cart icon with badge
- Mobile hamburger menu

**Current Status:** Exists but needs enhancement for:
- [ ] Announcement bar (scrolling text) - "تنبية هام فى حاله الرفض..."
- [ ] Search functionality
- [ ] Cart/Wishlist item count badges
- [ ] Better mobile menu

### 2. Hero Banner Slider ⚠️ NEEDS ENHANCEMENT
**Turkey Store Features:**
- Full-width banner carousel
- Auto-sliding banners for collections (Winter, Shoes, Summer)
- Clickable to collection pages

**Current:** `HeroSection.vue` - uses `UPageHero` (static)
**Needed:** Full-width image carousel with auto-slide

### 3. Shop by Category Grid ✅ EXISTS (needs styling update)
**Turkey Store Features:**
- Section title: "تسوق حسب الفئة"
- Subtitle: "اختر من مجموعة متنوعة من الفئات المختارة خصيصاً لك"
- 4 category cards in grid (2x2 on mobile, 4 on desktop)
- Each card: image, category name overlay

**Current:** `CategoryGrid.vue`
**Endpoint:** `/api/public/categories` ✅

### 4. Featured Collection Carousel (e.g., "قميص موضة 2026") ⚠️ NEEDS CREATION
**Turkey Store Features:**
- Section title with "المزيد" (More) link
- Horizontal scrollable product carousel
- Product cards with:
  - Image
  - Title
  - Original price (strikethrough)
  - Sale price
  - Discount badge

**Current:** `ProductCarousel.vue` exists
**Endpoint:** `/api/public/products?categorySlug=xxx` ✅

### 5. Suggested Products Section ("مقترحة لك") ✅ CAN USE ProductCarousel
Same structure as section 4, different query

### 6. Best Sellers Section ("الأكثر مبيعاً") ⚠️ NEEDS ENHANCEMENT
**Turkey Store Features:**
- Horizontal scroll carousel
- Product cards with discount percentage badge
- Larger card style

**Endpoint:** `/api/public/products?sort=bestseller` (needs sort param)

### 7. Latest Products Section ("احدث المنتجات") ✅ CAN USE ProductCarousel
**Endpoint:** `/api/public/products?sort=newest` ✅

### 8. Browse Featured Categories ("تصفح فئاتنا المميزة") ⚠️ NEEDS NEW COMPONENT
**Turkey Store Features:**
- Section title + subtitle
- Large category cards with:
  - Image overlay
  - Category name
  - Product count (e.g., "253 منتج")
  - "عرض التفاصيل" button on hover

**Endpoint:** `/api/public/categories` ✅

### 9. Store Features Section ("مميزاتنا") ⚠️ NEEDS CREATION
**Turkey Store Features:**
- Section title: "مميزاتنا" + "مميزات المتجر"
- 3 feature cards:
  - Fast & safe shipping icon + title + description
  - 100% Original products
  - Easy return policy

**Component:** New `StoreFeatures.vue` - static content

### 10. Customer Reviews/Testimonials ("بعض شهادات العملاء المميزة") ✅ EXISTS
**Turkey Store Features:**
- Section title
- Horizontal carousel of testimonial cards
- Each card: customer photo, name, location, social icon, review text

**Current:** `CustomerReviews.vue`
**Enhancement Needed:** Auto-sliding carousel

### 11. Footer (StoreFooter.vue) ✅ EXISTS
**Turkey Store Features:**
- Social media links (Facebook, Instagram)
- Copyright text
- Policy links (Privacy, Terms, Refund, Shipping)

**Current:** Exists, needs more links

---

## 📂 Category Pages

### Categories List (`/categories`) ✅ EXISTS
**Endpoint:** `/api/public/categories`

### Category Detail (`/categories/[slug]`) ✅ EXISTS
**Turkey Store Features:**
- Category title (e.g., "رجالى")
- Sort dropdown (الأعلى تقييما)
- Sub-categories horizontal scroll (if has children)
- Product grid (3-4 columns)
- "تحميل المزيد" (Load more) button

**Endpoint:** `/api/public/categories/[slug]`, `/api/public/products?categorySlug=xxx`

---

## 🛍️ Product Pages

### Products List (`/products`) ✅ EXISTS
**Needed Enhancements:**
- [ ] Filter sidebar/modal
- [ ] Sort dropdown
- [ ] Infinite scroll or pagination

### Product Detail (`/products/[slug]`) ✅ EXISTS
**Turkey Store Features:**
- Image gallery with thumbnails
- Product title
- Price (before/after discount)
- Size selector (if applicable)
- Countdown timer for discount
- "يشاهد هذا المنتج الآن X عميل" (X customers viewing now)
- Quick order form (name, phone, governorate, address)
- "أضف للسلة" (Add to cart) button
- "اضغط هنا للشراء" (Buy now) button
- Product description
- Customer reviews section

**Endpoint:** `/api/public/products/[slug]` ✅

**Needed Enhancements:**
- [ ] Size/variant selector
- [ ] Quick order form (cash on delivery)
- [ ] Customer review system
- [ ] Countdown timer component
- [ ] Live viewers count (fake or real)

---

## 🛒 Cart & Checkout

### Cart Page (`/cart`) ✅ EXISTS
**Current:** Uses localStorage via `useCart()`
**Features present:**
- Item list with quantity controls
- Remove item
- Order summary
- Checkout button

### Checkout Page (`/checkout`) ✅ EXISTS
**Current:** Multi-step stepper (Shipping → Payment → Review)
**Turkey Store Style:** Single-page form with:
- Customer info (name, phone, governorate, address)
- Shipping cost display
- Coupon code input
- Payment method (Cash on Delivery)
- Order total

**Endpoint Needed:** `/api/orders` (POST)

---

## 📜 Static Pages (Need Creation)

| Page | Route | Content |
|------|-------|---------|
| Privacy Policy | `/pages/privacy-policy` | سياسات الخصوصية |
| Refund Policy | `/pages/refund-policy` | سياسة الاستبدال و الاسترجاع |
| Terms & Conditions | `/pages/terms-and-conditions` | شروط الاستخدام |
| Shipping Policy | `/pages/shipping-policy` | سياسة الشحن |

---

## ✅ Component Checklist

### Layout Components
| Component | Status | Dark Mode |
|-----------|--------|-----------|
| `layouts/storefront.vue` | ✅ Exists | ⚠️ Needs dark classes |
| `StoreHeader.vue` | ✅ Exists | ⚠️ Needs dark classes |
| `StoreFooter.vue` | ✅ Exists | ⚠️ Needs dark classes |

### Homepage Components
| Component | Status | Dark Mode |
|-----------|--------|-----------|
| `AnnouncementBar.vue` | ❌ Create | ❌ |
| `HeroBannerSlider.vue` | ❌ Create | ❌ |
| `CategoryGrid.vue` | ✅ Exists | ⚠️ Needs dark |
| `FeaturedCategories.vue` | ❌ Create | ❌ |
| `ProductCarousel.vue` | ✅ Exists | ⚠️ Needs dark |
| `ProductCard.vue` | ✅ Exists | ⚠️ Needs dark |
| `StoreFeatures.vue` | ❌ Create | ❌ |
| `CustomerReviews.vue` | ✅ Exists | ⚠️ Needs dark |
| `SocialMediaLinks.vue` | ✅ Exists | ⚠️ Needs dark |
| `ChatWidget.vue` | ✅ Exists | ⚠️ Needs dark |

### Product Components
| Component | Status | Dark Mode |
|-----------|--------|-----------|
| `ProductGallery.vue` | ❌ Create | ❌ |
| `ProductInfo.vue` | ❌ Create | ❌ |
| `VariantSelector.vue` | ❌ Create | ❌ |
| `QuickOrderForm.vue` | ❌ Create | ❌ |
| `CountdownTimer.vue` | ❌ Create | ❌ |
| `LiveViewers.vue` | ❌ Create | ❌ |
| `ProductReviews.vue` | ❌ Create | ❌ |
| `RelatedProducts.vue` | ✅ Partial | ⚠️ Needs dark |

### Cart/Checkout Components
| Component | Status | Dark Mode |
|-----------|--------|-----------|
| `CartItem.vue` | ✅ Inline | ⚠️ Needs dark |
| `OrderSummary.vue` | ✅ Inline | ⚠️ Needs dark |
| `CheckoutForm.vue` | ✅ Partial | ⚠️ Needs dark |
| `CouponInput.vue` | ❌ Create | ❌ |

---

## 🔌 Endpoint Mapping

### Existing Endpoints ✅
```
GET  /api/public/products              # List products (pagination, filters)
GET  /api/public/products/[slug]       # Single product details
GET  /api/public/categories            # List categories
GET  /api/public/categories/[slug]     # Single category with products
```

### Query Parameters Available
```
/api/public/products?
  pageSize=12           # Items per page
  page=1                # Page number
  sort=featured|newest  # Sort order
  categorySlug=xxx      # Filter by category
  search=xxx            # Search term
```

### Endpoints Needed ⚠️
```
POST /api/public/orders               # Create guest order (COD)
GET  /api/public/products/bestsellers # Best selling products
POST /api/public/reviews              # Submit product review
GET  /api/public/products/[slug]/reviews  # Get product reviews
```

---

## 🌓 Dark/Light Mode Requirements

All components must support dark mode using Tailwind's `dark:` prefix and Nuxt UI's color system.

### Color Scheme Reference

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `bg-white` / `bg-gray-50` | `dark:bg-gray-900` / `dark:bg-gray-950` |
| Card BG | `bg-white` | `dark:bg-gray-800` |
| Text Primary | `text-gray-900` | `dark:text-gray-100` |
| Text Secondary | `text-gray-600` | `dark:text-gray-400` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Hover | `hover:bg-gray-100` | `dark:hover:bg-gray-700` |

### Layout Dark Mode Fix
Update `layouts/storefront.vue`:
```vue
<div class="min-h-screen flex flex-col 
  bg-gradient-to-b from-white via-slate-50 to-white 
  dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 
  text-gray-900 dark:text-gray-100">
```

### Component Dark Mode Classes
Each component needs these patterns:
```vue
<!-- Cards -->
<UCard class="bg-white dark:bg-gray-800">

<!-- Text -->
<p class="text-gray-600 dark:text-gray-400">

<!-- Borders -->
<div class="border border-gray-200 dark:border-gray-700">

<!-- Overlays -->
<div class="bg-black/40 dark:bg-black/60">
```

---

## 🎯 Implementation Priority

### Phase 1: Core Layout & Dark Mode
1. [ ] Update `storefront.vue` layout with dark mode
2. [ ] Update `StoreHeader.vue` with dark mode + announcement bar
3. [ ] Update `StoreFooter.vue` with dark mode + all links
4. [ ] Update all existing components with dark mode classes

### Phase 2: Homepage Sections
1. [ ] Create `HeroBannerSlider.vue`
2. [ ] Update `CategoryGrid.vue` styling
3. [ ] Create `FeaturedCategories.vue`
4. [ ] Create `StoreFeatures.vue`
5. [ ] Enhance `CustomerReviews.vue` with carousel

### Phase 3: Product Pages
1. [ ] Create `ProductGallery.vue` with thumbnails
2. [ ] Create `VariantSelector.vue`
3. [ ] Create `QuickOrderForm.vue`
4. [ ] Create `CountdownTimer.vue`
5. [ ] Create `ProductReviews.vue`

### Phase 4: Cart & Checkout
1. [ ] Create `CouponInput.vue`
2. [ ] Update checkout to single-page form style
3. [ ] Add COD order API endpoint

### Phase 5: Static Pages
1. [ ] Create `/pages/privacy-policy.vue`
2. [ ] Create `/pages/refund-policy.vue`
3. [ ] Create `/pages/terms-and-conditions.vue`
4. [ ] Create `/pages/shipping-policy.vue`

### Phase 6: Search
1. [ ] Create `/search.vue` page
2. [ ] Add search modal/slideover in header

---

## 📝 Notes

1. **RTL Support**: Turkey Store is Arabic (RTL). Current setup may need `dir="rtl"` support if Arabic content is used.

2. **Currency**: Turkey Store uses EGP (Egyptian Pound). Current setup already uses EGP.

3. **Animations**: Keep animations minimal as requested:
   - Subtle hover effects on cards
   - Smooth carousel transitions
   - No complex animations

4. **Mobile First**: Ensure all components are responsive:
   - 1 column on mobile
   - 2 columns on tablet  
   - 3-4 columns on desktop

5. **Lazy Loading**: All images should use `loading="lazy"` (already implemented).
