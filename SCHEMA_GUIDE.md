# Database Schema Visual Reference

## 🗂️ Core E-Commerce Models

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTS & CATALOG                         │
└─────────────────────────────────────────────────────────────────┘

Category                    Brand                    Product
├─ id                      ├─ id                    ├─ id
├─ name (JSON)             ├─ name (JSON)           ├─ name (JSON) *
├─ slug                    ├─ slug                  ├─ description (JSON) *
├─ parentId ──┐            ├─ logo                  ├─ shortDescription (JSON)
└─ children   │            ├─ description (JSON)    ├─ price **
              │            └─ products[]            ├─ salePrice
              │                  │                  ├─ discountPercentage
              │                  ├─────────────────>├─ quantity **
              │                  │                  ├─ stock
              └─────────────────>│                  ├─ slug
                                 │                  ├─ images[] **
                                 │                  ├─ rating
                                 │                  ├─ categoryId
                                 │                  ├─ brandId
                                 │                  ├─ categoryName (JSON)
                                 │                  ├─ brandName (JSON)
                                 │                  └─ seo (JSON)

* Multi-language: { en: "...", ar: "..." }
** Required for product management
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOMERS & USERS                          │
└─────────────────────────────────────────────────────────────────┘

User (Customer)              Address                  UserPreference
├─ id                       ├─ id                    ├─ id
├─ name                     ├─ userId ──────┐        ├─ userId ──┐
├─ email                    ├─ street       │        ├─ preferredLanguage
├─ authProvider             ├─ city         │        ├─ minPrice
├─ phoneNumber              ├─ state        │        ├─ maxPrice
├─ isActive *               ├─ postalCode   │        ├─ categories[]
├─ role (CUSTOMER/ADMIN)    ├─ country      │        ├─ brands[]
├─ lastSession              └─ isDefault    │        └─ lastViewed...
├─ defaultAddressId ────────────────────────┘
├─ addresses[]
├─ cart
├─ wishlist
├─ orders[]
└─ behaviors[]

* Use for customer status management
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORDERS & CHECKOUT                          │
└─────────────────────────────────────────────────────────────────┘

Order                       OrderItem
├─ id                      ├─ id
├─ userId ────┐            ├─ orderId ──────┐
├─ subtotal   │            ├─ productId     │
├─ discount   │            ├─ variantId     │
├─ shippingCost           ├─ quantity      │
├─ totalAmount **         ├─ price         │
├─ status * (enum)        ├─ totalPrice    │
├─ paymentMethod (enum)   ├─ status (enum) │
├─ customerName **        └─ productName   │
├─ shippingPhone **                        │
├─ shippingWhatsapp                        │
├─ shippingStreet **                       │
├─ shippingCity **                         │
├─ shippingCountry **                      │
└─ items[] <───────────────────────────────┘

* OrderStatus: PENDING → SHIPPING → DELIVERED
** Required shipping information

PaymentMethod enum:
- CASH
- VODAFONE_CASH
- INSTAPAY
- VISA
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      CART & WISHLIST                            │
└─────────────────────────────────────────────────────────────────┘

Cart                        CartItem
├─ id                      ├─ id
├─ userId (unique)         ├─ cartId ──────┐
└─ items[]                 ├─ productId    │
                           ├─ quantity     │
                           └─ cart <───────┘

Wishlist                    WishlistItem
├─ id                      ├─ id
├─ userId (unique)         ├─ wishlistId ──┐
└─ items[]                 ├─ productId     │
                           ├─ quantity      │
                           └─ wishlist <────┘
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRICING & DISCOUNTS                        │
└─────────────────────────────────────────────────────────────────┘

CartPricingRule             PriceSettings
├─ id                      ├─ id
├─ name                    ├─ chargeFee
├─ type *                  ├─ shippingFee
├─ applicationType **      ├─ currency (default: EGP)
├─ value                   ├─ minOrderValue
├─ minOrderValue           ├─ maxOrderValue
├─ maxDiscount             ├─ bulkDiscountThreshold
├─ startDate               ├─ bulkDiscountPercentage
├─ endDate                 ├─ discounts[]
├─ isActive                └─ promoCodes[]
├─ code (unique)
└─ description             PricePromoCode
                           ├─ id
* PricingRuleType:         ├─ code (unique)
  - FEE                    ├─ discount
  - DISCOUNT               ├─ validFrom
  - PROMO                  ├─ validTo
                           ├─ usageLimit
** PricingApplicationType: ├─ usageCount
  - PERCENTAGE             └─ priceSettingsId
  - FIXED
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN (YOU!)                         │
└─────────────────────────────────────────────────────────────────┘

SuperAdmin                  SuperAdminSession
├─ id                      ├─ id
├─ name                    ├─ token (unique)
├─ email (unique)          ├─ superAdminId ──────┐
├─ passwordHash            ├─ userAgent          │
├─ role * (enum)           ├─ ipAddress          │
├─ createdById ──┐         ├─ expiresAt          │
├─ createdBy     │         └─ superAdmin <────────┘
└─ createdSuperAdmins[] <──┘

* SuperAdminRole:
  - OWNER (full access)
  - MANAGER (most features)
  - SALE (view + update orders)
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      SETTINGS & CONFIG                          │
└─────────────────────────────────────────────────────────────────┘

GeneralSettings             ContactSettings         SocialSettings
├─ storeName               ├─ whatsappLink         ├─ facebookGroup
├─ storeDescription        ├─ phoneNumber          ├─ facebookPage
├─ currency                ├─ whatsappNumber       ├─ instagramPage
├─ languageOptions[]       ├─ vodafoneCashNumber   └─ whatsappGroup
├─ defaultLanguage         ├─ instaPayUrl
└─ seo (JSON)              ├─ instaPayQrCode
                           └─ instaPayNumber

WhatsAppSettings
├─ isEnabled
├─ connectionStatus
├─ businessPhone
├─ recipientPhone
├─ qrCode
├─ sessionData (JSON)
├─ autoReconnect
├─ messageTemplate (JSON)
├─ sendToCustomer
├─ sendToBusiness
└─ businessNotificationNumber
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BEHAVIOR TRACKING                     │
└─────────────────────────────────────────────────────────────────┘

UserBehavior
├─ id
├─ userId ──────────┐
├─ productId ───┐   │
├─ type *       │   │
├─ value        │   │
├─ language     │   │
├─ timestamp    │   │
├─ user <───────────┘
└─ product <────┘

* BehaviorType:
  - VIEW
  - PURCHASE
  - CART
  - WISHLIST
  - RATING
```

---

## 📊 Key Relationships

### Product Ecosystem
```
Category (tree) ──┬──> Product ──┬──> CartItem
                  │               ├──> WishlistItem
Brand ────────────┘               ├──> OrderItem
                                  └──> UserBehavior
```

### Order Flow
```
User (Customer) ──> Cart ──> Order ──> OrderItem ──> Product
                     │
                     └──> CartPricingRule (applied)
```

### Admin Hierarchy
```
SuperAdmin (OWNER)
    │
    ├──> SuperAdmin (MANAGER) ──> Created by OWNER
    │
    └──> SuperAdmin (SALES) ──> Created by OWNER or MANAGER
```

---

## 🎯 What You Need to Focus On

### Phase 1 - Products (Week 1-2)
- **Product** model - Full CRUD
- **Category** model - Tree structure
- **Brand** model - Basic CRUD
- Images handling (local or cloud)

### Phase 2 - Orders (Week 3-4)
- **Order** model - List, detail, status updates
- **OrderItem** - Linked to products
- **User** (customers) - Integration with orders

### Phase 3 - Inventory (Week 5)
- **Product.quantity** - Stock tracking
- **Product.stock** - Alerts
- Low stock warnings

### Phase 4 - Analytics (Week 5-6)
- Aggregate queries on Orders
- Revenue calculations
- Customer insights

---

## 💡 Important Notes

### Multi-Language Fields (JSON)
```prisma
name Json  // Stored as: { "en": "Product Name", "ar": "اسم المنتج" }
```

In your API:
```typescript
// Creating:
{ name: { en: "iPhone", ar: "آيفون" } }

// Querying (Prisma):
where: {
  name: { path: ['en'], string_contains: 'iPhone' }
}
```

### Enums to Remember
- **OrderStatus**: PENDING, SHIPPING, DELIVERED
- **PaymentMethod**: CASH, VODAFONE_CASH, INSTAPAY, VISA
- **SuperAdminRole**: OWNER, MANAGER, SALE
- **Role**: CUSTOMER, ADMIN (for User model)
- **BehaviorType**: VIEW, PURCHASE, CART, WISHLIST, RATING

### Foreign Key Cascades
- User deleted → Cart, Wishlist, Addresses cascade delete
- Cart/Wishlist deleted → CartItem/WishlistItem cascade delete
- Order deleted → OrderItem cascade delete
- User deleted → Orders set userId to NULL (keep order history)

---

## 🔗 Quick Reference

| Model | Primary Use | Dashboard Priority |
|-------|-------------|-------------------|
| Product | Catalog management | 🔴 High |
| Category | Product organization | 🔴 High |
| Brand | Product filtering | 🟡 Medium |
| Order | Sales tracking | 🔴 High |
| User | Customer management | 🟠 High |
| CartPricingRule | Discounts/fees | 🟡 Medium |
| PriceSettings | Global pricing | 🟡 Medium |
| SuperAdmin | Dashboard users | ✅ Done |
| GeneralSettings | Store config | 🟢 Low |
| WhatsAppSettings | Notifications | 🟢 Low |

---

**Use this as your schema reference while building APIs!**
