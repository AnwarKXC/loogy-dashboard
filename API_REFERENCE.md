# E-Commerce Dashboard - API Endpoints Summary

## 🔐 Authentication (✅ COMPLETED)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/superadmin/login` | Public | Login super admin |
| POST | `/api/superadmin/logout` | Any | Logout super admin |
| GET | `/api/superadmin/session` | Any | Get current session |
| PATCH | `/api/superadmin/account` | Any | Update own profile/password |
| POST | `/api/superadmin/accounts` | OWNER | Create new admin |
| GET | `/api/superadmin/accounts` | Any | List all admins |

---

## 🛍️ Products (⚠️ TO BUILD - PHASE 1)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/products` | Any | List products (with filters, pagination) |
| GET | `/api/products/:id` | Any | Get single product |
| POST | `/api/products` | OWNER, MANAGER | Create product |
| PATCH | `/api/products/:id` | OWNER, MANAGER | Update product |
| DELETE | `/api/products/:id` | OWNER | Delete product |
| POST | `/api/products/bulk` | OWNER, MANAGER | Bulk import/update |

**Query Params for GET /api/products:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `search` (string) - Search in name/description
- `categoryId` (number) - Filter by category
- `brandId` (number) - Filter by brand
- `minPrice` (number) - Min price filter
- `maxPrice` (number) - Max price filter
- `inStock` (boolean) - Only in-stock items

---

## 📂 Categories (⚠️ TO BUILD - PHASE 1)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/categories` | Any | Get category tree |
| GET | `/api/categories/:id` | Any | Get single category |
| POST | `/api/categories` | OWNER, MANAGER | Create category |
| PATCH | `/api/categories/:id` | OWNER, MANAGER | Update category |
| DELETE | `/api/categories/:id` | OWNER | Delete category (if no products) |

---

## 🏷️ Brands (⚠️ TO BUILD - PHASE 1)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/brands` | Any | List all brands |
| GET | `/api/brands/:id` | Any | Get single brand |
| POST | `/api/brands` | OWNER, MANAGER | Create brand |
| PATCH | `/api/brands/:id` | OWNER, MANAGER | Update brand |
| DELETE | `/api/brands/:id` | OWNER | Delete brand (if no products) |

---

## 📦 Orders (⚠️ TO BUILD - PHASE 2)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/orders` | Any | List orders (with filters) |
| GET | `/api/orders/:id` | Any | Get order details |
| PATCH | `/api/orders/:id` | OWNER, MANAGER | Update order details |
| PATCH | `/api/orders/:id/status` | Any | Update order status |
| DELETE | `/api/orders/:id` | OWNER | Cancel/delete order |
| POST | `/api/orders/export` | Any | Export orders to CSV |

**Query Params for GET /api/orders:**
- `page`, `limit` - Pagination
- `status` - Filter by OrderStatus (PENDING, SHIPPING, DELIVERED)
- `paymentMethod` - Filter by payment method
- `customerId` - Filter by customer
- `dateFrom`, `dateTo` - Date range
- `search` - Search customer name/phone

---

## 👥 Customers (⚠️ TO BUILD - PHASE 2)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/customers` | Any | List customers |
| GET | `/api/customers/:id` | Any | Get customer details |
| PATCH | `/api/customers/:id` | OWNER, MANAGER | Update customer |
| DELETE | `/api/customers/:id` | OWNER | Delete customer |
| GET | `/api/customers/:id/orders` | Any | Customer order history |
| GET | `/api/customers/:id/behavior` | OWNER, MANAGER | Customer behavior analytics |

---

## 📊 Analytics & Dashboard (⚠️ TO BUILD - PHASE 4)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/analytics/overview` | Any | Dashboard stats (revenue, orders, customers) |
| GET | `/api/analytics/revenue` | OWNER, MANAGER | Revenue trends by period |
| GET | `/api/analytics/products` | Any | Top products, low stock |
| GET | `/api/analytics/customers` | OWNER, MANAGER | Customer insights |

**Response for /api/analytics/overview:**
```json
{
  "totalRevenue": 125000,
  "revenueGrowth": 12.5,
  "totalOrders": 450,
  "ordersGrowth": 8.2,
  "totalCustomers": 320,
  "customersGrowth": 15.3,
  "pendingOrders": 12,
  "topProducts": [...],
  "recentOrders": [...]
}
```

---

## 📦 Inventory (⚠️ TO BUILD - PHASE 3)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/inventory/stock` | Any | Stock levels report |
| GET | `/api/inventory/low-stock` | Any | Products with low stock |
| PATCH | `/api/inventory/:productId` | OWNER, MANAGER | Update stock quantity |
| POST | `/api/inventory/adjust` | OWNER, MANAGER | Bulk stock adjustment |

---

## 💰 Pricing & Discounts (⚠️ TO BUILD - PHASE 3)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/pricing/rules` | Any | List pricing rules |
| POST | `/api/pricing/rules` | OWNER, MANAGER | Create pricing rule |
| PATCH | `/api/pricing/rules/:id` | OWNER, MANAGER | Update rule |
| DELETE | `/api/pricing/rules/:id` | OWNER | Delete rule |
| GET | `/api/pricing/settings` | Any | Get price settings |
| PATCH | `/api/pricing/settings` | OWNER | Update price settings |

---

## ⚙️ Settings (⚠️ TO BUILD - PHASE 5)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/settings/general` | Any | Store settings |
| PATCH | `/api/settings/general` | OWNER | Update store settings |
| GET | `/api/settings/contact` | Any | Contact info |
| PATCH | `/api/settings/contact` | OWNER, MANAGER | Update contact |
| GET | `/api/settings/social` | Any | Social media links |
| PATCH | `/api/settings/social` | OWNER, MANAGER | Update social |

---

## 📱 WhatsApp Integration (⚠️ TO BUILD - PHASE 5)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/whatsapp/status` | Any | Connection status |
| POST | `/api/whatsapp/connect` | OWNER | Initialize connection (get QR) |
| POST | `/api/whatsapp/disconnect` | OWNER | Disconnect session |
| PATCH | `/api/whatsapp/settings` | OWNER | Update settings |

---

## 📤 File Upload (⚠️ TO BUILD - PHASE 6)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/upload/image` | OWNER, MANAGER | Upload single image |
| POST | `/api/upload/images` | OWNER, MANAGER | Upload multiple images |
| DELETE | `/api/upload/image/:key` | OWNER, MANAGER | Delete image |
| POST | `/api/upload/csv` | OWNER, MANAGER | Upload CSV for bulk import |

---

## 📈 Reports (⚠️ TO BUILD - PHASE 6)

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/reports/sales` | OWNER, MANAGER | Sales report |
| GET | `/api/reports/products` | OWNER, MANAGER | Product performance |
| GET | `/api/reports/customers` | OWNER, MANAGER | Customer reports |
| POST | `/api/reports/export` | OWNER, MANAGER | Export report (CSV/PDF) |

---

## 🎯 Implementation Priority

### 🔴 Phase 1 - CRITICAL (Week 1-2)
- ✅ Products CRUD
- ✅ Categories CRUD
- ✅ Brands CRUD

### 🟠 Phase 2 - HIGH (Week 3-4)
- Orders Management
- Customers Integration
- Dashboard Analytics

### 🟡 Phase 3 - MEDIUM (Week 5)
- Inventory Tracking
- Pricing Rules

### 🟢 Phase 4 - LOW (Week 6+)
- Settings Pages
- WhatsApp Integration
- Reports & Export
- File Upload

---

## 📝 Standard Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "statusMessage": "Validation error",
  "message": "Email already exists",
  "data": {
    "errors": [...]
  }
}
```

---

## 🔐 Authentication Flow

All protected endpoints require:

1. **Session Cookie** - Set after login
2. **Role Check** - Endpoint validates required role
3. **Session Validation** - Token expiry checked

**Middleware Applied:**
- `server/middleware/superadmin-session.ts` - Loads session into context
- Each endpoint calls `requireSuperAdmin(event, roles?)` as needed

---

## 📦 Request Validation Pattern

Use Zod for all inputs:

```typescript
import { z } from 'zod'

const productSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    ar: z.string().min(1)
  }),
  description: z.object({
    en: z.string().optional(),
    ar: z.string().optional()
  }).optional(),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  categoryId: z.number().int().optional(),
  brandId: z.number().int().optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, ['OWNER', 'MANAGER'])
  
  const body = await readBody(event)
  const validated = productSchema.parse(body) // Throws if invalid
  
  // Use validated data...
})
```

---

## 🧪 Testing Checklist

For each endpoint:

- [ ] Authentication required?
- [ ] Role check working?
- [ ] Input validation (Zod)?
- [ ] Error handling?
- [ ] Response format correct?
- [ ] Pagination working?
- [ ] Filters working?
- [ ] Performance acceptable?

---

**Legend:**
- ✅ Completed
- ⚠️ To Build
- 🔴 Critical Priority
- 🟠 High Priority
- 🟡 Medium Priority
- 🟢 Low Priority
