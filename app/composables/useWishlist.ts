import { useState } from '#app'

export interface WishlistItem {
  title: string
  price: number
  image?: string
  productId?: number | string
  variantId?: number | string
}

export const useWishlist = () => {
  const items = useState<WishlistItem[]>('wishlist:items', () => [])

  const add = (item: WishlistItem) => {
    if (items.value.some(i => i.productId === item.productId && i.variantId === item.variantId)) {
      return
    }
    items.value.push(item)
  }

  const remove = (productId: WishlistItem['productId'], variantId: WishlistItem['variantId']) => {
    items.value = items.value.filter(i => i.productId !== productId || i.variantId !== variantId)
  }

  const clear = () => {
    items.value = []
  }

  return { items, add, remove, clear }
}
