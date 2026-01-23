import { Prisma } from '@prisma/client'

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true
            slug: true
            images: true
            translations: {
              select: {
                lang: true
                name: true
              }
            }
          }
        }
      }
    }
    governorate: true
    area: true
  }
}>

export function getOrderInclude(): Prisma.OrderInclude {
  return {
    items: {
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            images: true,
            translations: {
              select: {
                lang: true,
                name: true
              }
            }
          }
        }
      }
    },
    governorate: true,
    area: true
  }
}

export function mapOrderToList(order: OrderWithRelations) {
  return {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    totalAmount: order.totalAmount.toNumber(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
    shippingCity: order.shippingCity,
    shippingCountry: order.shippingCountry
  }
}

export function mapOrderToDetail(order: OrderWithRelations) {
  const listItem = mapOrderToList(order)

  return {
    ...listItem,
    subtotal: order.subtotal.toNumber(),
    shippingCost: order.shippingCost.toNumber(),
    discount: order.discount?.toNumber() ?? null,
    promoCode: order.promoCode,
    notes: order.notes,
    shippingPhone: order.shippingPhone,
    shippingStreet: order.shippingStreet,
    shippingCity: order.shippingCity,
    shippingCountry: order.shippingCountry,
    governorateId: order.governorateId,
    areaId: order.areaId,
    governorate: order.governorate
      ? {
          id: order.governorate.id,
          nameEn: order.governorate.nameEn,
          nameAr: order.governorate.nameAr
        }
      : null,
    area: order.area
      ? {
          id: order.area.id,
          nameEn: order.area.nameEn,
          nameAr: order.area.nameAr
        }
      : null,
    items: order.items.map((item) => {
      // Get product name from translations (prefer English)
      const productName = item.product?.translations?.find(t => t.lang === 'EN')?.name
        || item.product?.translations?.[0]?.name
        || 'Unknown Product'

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
        productName,
        productSlug: item.product?.slug || null,
        productImage: item.product?.images?.[0] || null,
        status: 'PENDING' // Default status for order items
      }
    })
  }
}

export function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}
