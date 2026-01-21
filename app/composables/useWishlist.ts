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
  const initialized = useState<boolean>('wishlist:initialized', () => false)
  const loading = useState<boolean>('wishlist:loading', () => false)

  const refresh = async () => {
    if (loading.value) return
    loading.value = true
    try {
      const response = await $fetch<{ items: Array<{
        productId: number
        variantId?: number | null
        name: string
        price: number
        image?: string | null
      }> }>('/api/public/wishlist')

      items.value = (response.items || []).map(item => ({
        title: item.name,
        price: item.price,
        image: item.image ?? undefined,
        productId: item.productId,
        variantId: item.variantId ?? undefined
      }))
    } finally {
      loading.value = false
    }
  }

  if (import.meta.client && !initialized.value) {
    initialized.value = true
    refresh()
  }

  const add = async (item: WishlistItem) => {
    if (!item.productId) return

    await $fetch('/api/public/wishlist', {
      method: 'POST',
      body: {
        productId: Number(item.productId),
        variantId: item.variantId ? Number(item.variantId) : undefined
      }
    })

    await refresh()
  }

  const remove = async (productId: WishlistItem['productId'], variantId: WishlistItem['variantId']) => {
    if (!productId) return

    await $fetch('/api/public/wishlist', {
      method: 'DELETE',
      body: {
        productId: Number(productId),
        variantId: variantId ? Number(variantId) : undefined
      }
    })

    await refresh()
  }

  const clear = async () => {
    const existing = [...items.value]

    for (const item of existing) {
      if (!item.productId) continue

      await $fetch('/api/public/wishlist', {
        method: 'DELETE',
        body: {
          productId: Number(item.productId),
          variantId: item.variantId ? Number(item.variantId) : undefined
        }
      })
    }

    await refresh()
  }

  return { items, add, remove, clear, refresh, loading }
}
