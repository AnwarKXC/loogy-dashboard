# E-Commerce Dashboard Development Roadmap

## 📋 Overview
This roadmap outlines the development path to transform the Nuxt UI Dashboard template into a fully functional e-commerce admin panel aligned with the Prisma schema.

---

## 🎯 Current State Assessment

### ✅ Completed
- **Super Admin Authentication System**
  - Login/logout endpoints
  - Session management with role support (OWNER, MANAGER, SALES)
  - Profile & password update functionality
  - Owner account auto-seeding
  - Role-based access control foundation

- **Prisma Schema**
  - Complete e-commerce data model
  - User management (customers & admins)
  - Product catalog (products, categories, brands)
  - Order management with status tracking
  - Cart & wishlist functionality
  - Pricing rules & settings
  - User behavior tracking
  - Multi-language support
  - WhatsApp integration structure

- **Base Dashboard UI**
  - Responsive layout with sidebar navigation
  - Dark/light mode support
  - Command palette (Cmd+K)
  - Notification system
  - Settings pages structure

### ❌ Missing / To Be Adapted
- All API endpoints except super-admin auth
- Frontend pages aligned with schema models
- Real data integration
- Role-based UI permissions
- Dashboard analytics & reporting
- File upload handling (product images, etc.)
- Multi-language admin interface

---

## 🗺️ Development Roadmap

## Phase 1: Core Infrastructure & Products (Weeks 1-2)

### 1.1 Product Management System
**Priority: HIGH**

#### Backend APIs
```
GET    /api/products              - List products with filters/pagination
GET    /api/products/:id          - Get single product details
POST   /api/products              - Create new product (OWNER/MANAGER)
PATCH  /api/products/:id          - Update product (OWNER/MANAGER)
DELETE /api/products/:id          - Delete product (OWNER only)
POST   /api/products/bulk         - Bulk import products (OWNER/MANAGER)
```

#### Frontend Pages
- `app/pages/products/index.vue` - Product listing with table
- `app/pages/products/[id].vue` - Product detail/edit page
- `app/pages/products/new.vue` - Create new product

#### Key Features
- Multi-language product data (name, description stored as JSON)
- Image upload (multiple images per product)
- Stock management
- Price & sale price handling
- Category & brand assignment
- SEO fields
- Bulk operations (import/export CSV)

---

### 1.2 Category Management
**Priority: HIGH**

#### Backend APIs
```
GET    /api/categories            - List all categories (tree structure)
GET    /api/categories/:id        - Get category details
POST   /api/categories            - Create category (OWNER/MANAGER)
PATCH  /api/categories/:id        - Update category (OWNER/MANAGER)
DELETE /api/categories/:id        - Delete category (OWNER only)
```

#### Frontend Pages
- `app/pages/categories/index.vue` - Category tree view
- Category CRUD modals/slideouts

#### Key Features
- Hierarchical category structure (parent-child)
- Multi-language category names
- Slug management
- Drag-and-drop reordering

---

### 1.3 Brand Management
**Priority: MEDIUM**

#### Backend APIs
```
GET    /api/brands                - List all brands
GET    /api/brands/:id            - Get brand details
POST   /api/brands                - Create brand (OWNER/MANAGER)
PATCH  /api/brands/:id            - Update brand (OWNER/MANAGER)
DELETE /api/brands/:id            - Delete brand (OWNER only)
```

#### Frontend Pages
- `app/pages/brands/index.vue` - Brand listing
- Brand CRUD modals

#### Key Features
- Logo upload
- Multi-language descriptions
- Brand filtering on products

---

## Phase 2: Order & Customer Management (Weeks 3-4)

### 2.1 Order Management System
**Priority: HIGH**

#### Backend APIs
```
GET    /api/orders                - List orders with filters
GET    /api/orders/:id            - Get order details
PATCH  /api/orders/:id/status     - Update order status
PATCH  /api/orders/:id            - Update order details (OWNER/MANAGER)
DELETE /api/orders/:id            - Cancel/delete order (OWNER only)
POST   /api/orders/export         - Export orders to CSV
```

#### Frontend Pages
- `app/pages/orders/index.vue` - Order listing with status filters
- `app/pages/orders/[id].vue` - Order detail page

#### Key Features
- Status management (PENDING → SHIPPING → DELIVERED)
- Payment method tracking
- Order item details
- Customer information display
- Shipping details
- Order timeline/history
- Print invoice
- Bulk status updates

---

### 2.2 Customer Management
**Priority: HIGH**

#### Backend APIs (Adapt existing `/api/users`)
```
GET    /api/users             - List customers with filters
GET    /api/users/:id         - Get customer details
PATCH  /api/users/:id         - Update customer (OWNER/MANAGER)
DELETE /api/users/:id         - Delete customer (OWNER only)
GET    /api/users/:id/orders  - Customer order history
GET    /api/users/:id/behavior - Customer behavior analytics
```

#### Frontend Pages
- Update `app/pages/customers.vue` - Use real User model data
- `app/pages/customers/[id].vue` - Customer profile page

#### Key Features
- Customer search & filtering
- Order history per customer
- Address management
- Customer behavior insights
- Active/inactive status toggle
- Last session tracking

---

## Phase 3: Inventory & Pricing (Week 5)

### 3.1 Inventory Management
**Priority: MEDIUM**

#### Backend APIs
```
GET    /api/inventory/stock       - Stock levels report
PATCH  /api/inventory/:productId  - Update stock quantity
POST   /api/inventory/adjust      - Bulk stock adjustments
GET    /api/inventory/low-stock   - Products with low stock alert
```

#### Frontend Pages
- `app/pages/inventory/index.vue` - Inventory overview
- Low stock alerts on dashboard

#### Key Features
- Stock level tracking
- Low stock warnings
- Stock adjustment history
- Out-of-stock notifications

---

### 3.2 Pricing Rules & Settings
**Priority: MEDIUM**

#### Backend APIs
```
GET    /api/pricing/rules         - List all pricing rules
POST   /api/pricing/rules         - Create pricing rule (OWNER/MANAGER)
PATCH  /api/pricing/rules/:id     - Update rule
DELETE /api/pricing/rules/:id     - Delete rule (OWNER only)
GET    /api/pricing/settings      - Get price settings
PATCH  /api/pricing/settings      - Update settings (OWNER only)
```

#### Frontend Pages
- `app/pages/pricing/rules.vue` - Manage discounts, fees, promos
- `app/pages/pricing/settings.vue` - Global pricing settings

#### Key Features
- Discount rules (percentage/fixed)
- Promo codes with usage limits
- Shipping fee configuration
- Bulk discount thresholds
- Min/max order values

---

## Phase 4: Analytics & Dashboard (Week 6)

### 4.1 Dashboard Analytics
**Priority: HIGH**

#### Backend APIs
```
GET    /api/analytics/overview    - Sales overview (revenue, orders)
GET    /api/analytics/products    - Top products
GET    /api/analytics/customers   - Customer insights
GET    /api/analytics/revenue     - Revenue trends
```

#### Frontend Pages
- Update `app/pages/index.vue` - Real analytics data

#### Key Features
- Total revenue, orders, customers
- Period comparison (daily/weekly/monthly)
- Top-selling products
- Revenue charts
- Recent orders feed
- Customer growth metrics

---

### 4.2 User Behavior Tracking
**Priority: LOW**

#### Backend APIs
```
GET    /api/behavior/products/:id - Product view/purchase analytics
GET    /api/behavior/trends       - Trending products
POST   /api/behavior/track        - Track user behavior (frontend)
```

#### Key Features
- View counts
- Purchase patterns
- Wishlist/cart analytics
- Rating aggregation

---

## Phase 5: Settings & Configuration (Week 7)

### 5.1 General Settings
**Priority: MEDIUM**

#### Backend APIs
```
GET    /api/settings/general      - Get store settings
PATCH  /api/settings/general      - Update settings (OWNER only)
GET    /api/settings/contact      - Contact info
PATCH  /api/settings/contact      - Update contact (OWNER/MANAGER)
GET    /api/settings/social       - Social media links
PATCH  /api/settings/social       - Update social (OWNER/MANAGER)
```

#### Frontend Pages
- Update `app/pages/settings/` - Real settings management

#### Key Features
- Store name & description
- Currency settings
- Language options
- SEO configuration
- Contact information (phone, WhatsApp, payment methods)
- Social media links

---

### 5.2 WhatsApp Integration
**Priority: LOW**

#### Backend APIs
```
GET    /api/whatsapp/status       - Connection status
POST   /api/whatsapp/connect      - Initialize connection
POST   /api/whatsapp/disconnect   - Disconnect session
PATCH  /api/whatsapp/settings     - Update WhatsApp settings
```

#### Frontend Pages
- `app/pages/settings/whatsapp.vue` - WhatsApp configuration

#### Key Features
- QR code connection
- Auto-reconnect toggle
- Message templates
- Business/customer notification settings

---

## Phase 6: Advanced Features (Week 8+)

### 6.1 Super Admin Management
**Priority: MEDIUM**

#### Backend APIs (Already scaffolded)
```
✅ POST   /api/superadmin/accounts    - Create new admin (OWNER only)
✅ GET    /api/superadmin/accounts    - List all admins
✅ PATCH  /api/superadmin/account     - Update own profile
DELETE /api/superadmin/accounts/:id - Delete admin (OWNER only)
```

#### Frontend Pages
- `app/pages/settings/admins.vue` - Manage super admins

#### Key Features
- Create/edit/delete admin accounts
- Role assignment (MANAGER/SALES)
- Activity logs
- Permission matrix

---

### 6.2 Reporting & Export
**Priority: LOW**

#### Backend APIs
```
GET    /api/reports/sales         - Sales report with filters
GET    /api/reports/products      - Product performance
GET    /api/reports/customers     - Customer reports
POST   /api/reports/export        - Export reports (CSV/PDF)
```

#### Frontend Pages
- `app/pages/reports/index.vue` - Reporting dashboard

#### Key Features
- Date range filtering
- Export to CSV/Excel
- Print-friendly views
- Scheduled reports (future)

---

### 6.3 File Management
**Priority: MEDIUM**

#### Backend APIs
```
POST   /api/upload/image          - Upload single image
POST   /api/upload/images         - Upload multiple images
DELETE /api/upload/image/:key     - Delete image
POST   /api/upload/csv            - Upload CSV for bulk import
```

#### Key Features
- Image optimization
- Cloud storage integration (AWS S3 / Cloudinary)
- Image resizing
- CSV parsing & validation

---

## 🔐 Role-Based Access Control

### Permission Matrix

| Feature                  | OWNER | MANAGER | SALES |
|--------------------------|-------|---------|-------|
| View Dashboard           | ✅     | ✅       | ✅     |
| View Orders              | ✅     | ✅       | ✅     |
| Update Order Status      | ✅     | ✅       | ✅     |
| Cancel/Delete Orders     | ✅     | ✅       | ❌     |
| View Products            | ✅     | ✅       | ✅     |
| Create/Edit Products     | ✅     | ✅       | ❌     |
| Delete Products          | ✅     | ❌       | ❌     |
| View Customers           | ✅     | ✅       | ✅     |
| Edit Customers           | ✅     | ✅       | ❌     |
| Delete Customers         | ✅     | ❌       | ❌     |
| Pricing & Discounts      | ✅     | ✅       | ❌     |
| Settings (General)       | ✅     | ❌       | ❌     |
| Settings (Contact/Social)| ✅     | ✅       | ❌     |
| Manage Admins            | ✅     | ❌       | ❌     |
| Reports & Analytics      | ✅     | ✅       | ✅     |

### Implementation Strategy
1. Update `server/utils/superadmin-session.ts` with granular permission checks
2. Create `requireRole(['OWNER', 'MANAGER'])` helper
3. Add frontend permission guards using composable
4. Hide UI elements based on role

---

## 🛠️ Technical Implementation Guidelines

### Backend Structure
```
server/
├── api/
│   ├── products/
│   │   ├── index.get.ts          # List products
│   │   ├── index.post.ts         # Create product
│   │   ├── [id].get.ts           # Get product
│   │   ├── [id].patch.ts         # Update product
│   │   ├── [id].delete.ts        # Delete product
│   │   └── bulk.post.ts          # Bulk operations
│   ├── orders/
│   ├── customers/
│   └── ...
├── utils/
│   ├── prisma.ts                 # ✅ Already exists
│   └── superadmin-session.ts     # ✅ Already exists
└── middleware/
    └── superadmin-session.ts     # ✅ Already exists
```

### Frontend Structure
```
app/
├── pages/
│   ├── index.vue                 # Dashboard (update with real data)
│   ├── products/
│   │   ├── index.vue             # Product list
│   │   ├── [id].vue              # Product detail
│   │   └── new.vue               # Create product
│   ├── orders/
│   │   ├── index.vue             # Order list
│   │   └── [id].vue              # Order detail
│   ├── customers/                # Update existing
│   └── settings/                 # Expand existing
├── components/
│   ├── products/
│   │   ├── ProductTable.vue
│   │   ├── ProductForm.vue
│   │   └── ImageUpload.vue
│   ├── orders/
│   │   ├── OrderTable.vue
│   │   └── OrderStatus.vue
│   └── ...
└── composables/
    ├── useProducts.ts            # Product CRUD operations
    ├── useOrders.ts              # Order operations
    └── usePermissions.ts         # Role-based permissions
```

### Data Fetching Pattern
```typescript
// Example: app/composables/useProducts.ts
export function useProducts() {
  const { data, pending, error, refresh } = useFetch('/api/products', {
    query: {
      page: 1,
      limit: 20,
      category: undefined,
      search: undefined
    }
  })

  async function createProduct(product: ProductInput) {
    return await $fetch('/api/products', {
      method: 'POST',
      body: product
    })
  }

  async function updateProduct(id: number, data: Partial<ProductInput>) {
    return await $fetch(`/api/products/${id}`, {
      method: 'PATCH',
      body: data
    })
  }

  return {
    products: data,
    pending,
    error,
    refresh,
    createProduct,
    updateProduct
  }
}
```

---

## 📊 Database Considerations

### Indexes (Already in Schema)
- User: `role`, `isActive`, `lastSession`
- Product: `categoryId`, `brandId`
- Order: `userId`, `status`, `paymentMethod`
- SuperAdmin: `role`

### Migration Strategy
1. Schema is ready - run `pnpm prisma migrate dev`
2. Seed initial data (already seeding owner account)
3. Add seed script for demo products/categories

---

## 🚀 Deployment Checklist

### Environment Variables
```env
DATABASE_URL="postgresql://..."
SUPERADMIN_OWNER_EMAIL="owner@example.com"
SUPERADMIN_OWNER_PASSWORD="secure_password"
SUPERADMIN_OWNER_NAME="Store Owner"
SESSION_SECRET="random_secret_key"
CLOUDINARY_CLOUD_NAME="..."  # For image uploads
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Production Optimization
- [ ] Enable Prisma connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up image optimization service
- [ ] Configure CORS for API
- [ ] Add rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Add API request validation with Zod
- [ ] Set up backup strategy

---

## 🎯 Success Metrics

### Phase 1-2 Goals
- ✅ All product CRUD operations functional
- ✅ Orders visible and status updatable
- ✅ Customer data integrated

### Phase 3-4 Goals
- ✅ Dashboard shows real sales data
- ✅ Inventory tracking active
- ✅ Pricing rules applied correctly

### Final Goals
- ✅ All schema models have working APIs
- ✅ Role-based access fully enforced
- ✅ Dashboard is production-ready
- ✅ Mobile responsive
- ✅ Performance optimized (< 3s page load)

---

## 🔄 Iteration Strategy

1. **Build API first** - Test with Postman/Thunder Client
2. **Create UI components** - Build reusable components
3. **Integrate & test** - Connect frontend to backend
4. **Refine UX** - Polish based on usage
5. **Document** - Add inline comments & API docs

---

## 📝 Next Immediate Steps

### Week 1 - Day 1-2
1. ✅ Create `/api/products/index.get.ts` with filters/pagination
2. ✅ Create `/api/products/index.post.ts` with Zod validation
3. ✅ Create `/api/categories/index.get.ts` with tree structure
4. ✅ Build `app/pages/products/index.vue` with UTable
5. ✅ Create product form component with image upload placeholder

### Week 1 - Day 3-5
1. ✅ Implement product update/delete APIs
2. ✅ Build product detail page
3. ✅ Add category selector component
4. ✅ Integrate image upload (use local storage initially)
5. ✅ Test full product CRUD workflow

### Parallel Planning - Brand Management

1. Draft brand CRUD endpoints (`GET/POST/PATCH/DELETE /api/brands`) mirroring category validation and role checks.
2. Outline brand listing UI (table + create/edit modals) reusing shared form patterns from categories.
3. Update product editors and filters to consume a centralized brand lookup feed once the endpoints are live.

---

## 📚 Resources & References

- [Nuxt UI Documentation](https://ui.nuxt.com)
- [Prisma Documentation](https://prisma.io/docs)
- [Zod Validation](https://zod.dev)
- Current Schema: `prisma/schema.prisma`
- Auth Implementation: `server/api/superadmin/`

---

## 💡 Notes

- **Multi-language**: Use JSON fields for content (name, description)
- **Pricing**: Consider CartPricingRule application logic
- **Images**: Start with local storage, migrate to cloud later
- **Testing**: Add tests incrementally (Vitest + Playwright)
- **Documentation**: Keep this roadmap updated as you progress

---

**Last Updated**: `{{ new Date().toISOString().split('T')[0] }}`
**Status**: Foundation Complete ✅ | Ready for Phase 1 🚀
