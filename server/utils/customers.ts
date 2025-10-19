import type { Prisma } from '~/generated/prisma'

export const customerListInclude = {
  _count: {
    select: {
      orders: true
    }
  }
} as const

export type CustomerListUser = Prisma.UserGetPayload<{
  include: typeof customerListInclude
}>

export function mapCustomerToListItem(user: CustomerListUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    status: user.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
    ordersCount: user._count.orders,
    lastSession: user.lastSession.toISOString(),
    createdAt: user.createdAt.toISOString()
  }
}
