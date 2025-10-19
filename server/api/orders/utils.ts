import type { Prisma } from '~/generated/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

export function getOrderInclude(): Prisma.OrderInclude {
  return {
    items: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
}

export function mapOrderToList(order: OrderWithRelations) {
  const customerEmail = order.user?.email ?? null

  return {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerEmail,
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
    shippingPhone: order.shippingPhone,
    shippingWhatsapp: order.shippingWhatsapp,
    shippingStreet: order.shippingStreet,
    shippingCity: order.shippingCity,
    shippingCountry: order.shippingCountry,
    customerId: order.userId,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
      status: item.status,
      productName: item.productName && typeof item.productName === 'object'
        ? extractLocalizedName(item.productName as Record<string, unknown>)
        : null
    }))
  }
}

function extractLocalizedName(json: Record<string, unknown>) {
  if (typeof json.en === 'string' && json.en.trim().length > 0) {
    return json.en
  }

  const firstString = Object.values(json).find(value => typeof value === 'string' && value.trim().length > 0)

  return typeof firstString === 'string' ? firstString : null
}

export function isKnownPrismaError(error: unknown): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError
}
