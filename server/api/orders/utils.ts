import { Prisma } from '@prisma/client'

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true
    governorate: true
    area: true
  }
}>

export function getOrderInclude(): Prisma.OrderInclude {
  return {
    items: true,
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
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.price.toNumber(),
      totalPrice: item.totalPrice.toNumber()
    }))
  }
}

export function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}
