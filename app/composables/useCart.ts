import { computed } from 'vue'
import { useState, useCookie } from '#app'

export interface CartLine {
  title: string
  price: number
  quantity: number
  image?: string
  productId?: number | string
  variantId?: number | string
  slug?: string
  salePrice?: number | null
}

// Cookie name constant
const CART_COOKIE_NAME = 'storefront_cart'

export const useCart = () => {
  const lines = useState<CartLine[]>('cart:lines', () => [])
  const initialized = useState<boolean>('cart:initialized', () => false)
  const loading = useState<boolean>('cart:loading', () => false)

  // Direct cookie access for sharing (used by getShareableCartUrl and importSharedCart)
  const _cartCookie = useCookie<{ items: Array<{ productId: number, variantId?: number, quantity: number }> }>(CART_COOKIE_NAME, {
    default: () => ({ items: [] }),
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  })

  const refresh = async () => {
    if (loading.value) return
    loading.value = true
    try {
      interface CartResponse {
        items: Array<{
          productId: number
          variantId?: number | null
          quantity: number
          name: string
          slug?: string
          price: number
          salePrice?: number | null
          image?: string | null
        }>
        subtotal: number
      }
      const response = await $fetch<CartResponse>('/api/public/cart')

      lines.value = (response.items || []).map(item => ({
        title: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image ?? undefined,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        slug: item.slug,
        salePrice: item.salePrice
      }))
    } finally {
      loading.value = false
    }
  }

  if (import.meta.client && !initialized.value) {
    initialized.value = true
    refresh()
  }

  const add = async (line: CartLine) => {
    if (!line.productId) return

    await $fetch('/api/public/cart', {
      method: 'POST',
      body: {
        productId: Number(line.productId),
        variantId: line.variantId ? Number(line.variantId) : undefined,
        quantity: line.quantity || 1
      }
    })

    await refresh()
  }

  const updateQty = async (productId: CartLine['productId'], variantId: CartLine['variantId'], quantity: number) => {
    if (!productId) return

    await $fetch('/api/public/cart', {
      method: 'PATCH',
      body: {
        productId: Number(productId),
        variantId: variantId ? Number(variantId) : undefined,
        quantity: Math.max(1, quantity)
      }
    })

    await refresh()
  }

  const remove = async (productId: CartLine['productId'], variantId: CartLine['variantId']) => {
    if (!productId) return

    await $fetch('/api/public/cart', {
      method: 'DELETE',
      body: {
        productId: Number(productId),
        variantId: variantId ? Number(variantId) : undefined
      }
    })

    await refresh()
  }

  const clear = async () => {
    const items = [...lines.value]

    for (const item of items) {
      if (!item.productId) continue

      await $fetch('/api/public/cart', {
        method: 'DELETE',
        body: {
          productId: Number(item.productId),
          variantId: item.variantId ? Number(item.variantId) : undefined
        }
      })
    }

    await refresh()
  }

  // Generate shareable cart URL
  const getShareableCartUrl = () => {
    if (lines.value.length === 0) return null
    const cartData = lines.value.map(item => ({
      p: Number(item.productId),
      v: item.variantId ? Number(item.variantId) : undefined,
      q: item.quantity
    }))
    const encoded = btoa(JSON.stringify(cartData))
    if (import.meta.client) {
      return `${window.location.origin}/cart?share=${encoded}`
    }
    return null
  }

  // Import cart from shareable URL
  const importSharedCart = async (shareCode: string) => {
    try {
      const decoded = atob(shareCode)
      const items = JSON.parse(decoded) as Array<{ p: number, v?: number, q: number }>

      // Clear current cart first
      await clear()

      // Add each item
      for (const item of items) {
        await $fetch('/api/public/cart', {
          method: 'POST',
          body: {
            productId: item.p,
            variantId: item.v,
            quantity: item.q
          }
        })
      }

      await refresh()
      return true
    } catch {
      return false
    }
  }

  const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.price * line.quantity, 0))
  const itemCount = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0))
  const isEmpty = computed(() => lines.value.length === 0)

  return {
    lines,
    add,
    updateQty,
    remove,
    clear,
    subtotal,
    itemCount,
    isEmpty,
    refresh,
    loading,
    getShareableCartUrl,
    importSharedCart
  }
}
