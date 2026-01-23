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

  // Generate shareable cart URL using slug:qty format
  const getShareableCartUrl = () => {
    if (lines.value.length === 0) return null
    // Format: ?items=slug1:qty1,slug2:qty2
    const itemsParam = lines.value
      .filter(item => item.slug)
      .map(item => `${item.slug}:${item.quantity}`)
      .join(',')

    if (!itemsParam) return null

    if (import.meta.client) {
      return `${window.location.origin}/cart?items=${encodeURIComponent(itemsParam)}`
    }
    return null
  }

  // Import cart from shareable URL (supports both new slug:qty format and legacy base64)
  const importSharedCart = async (shareParam: string) => {
    try {
      let items: Array<{ slug: string, quantity: number }> = []

      // Check if it's the new slug:qty format (contains colons and commas)
      if (shareParam.includes(':')) {
        // New format: slug1:qty1,slug2:qty2
        items = shareParam.split(',').map((pair) => {
          const [slug, qty] = pair.split(':')
          return { slug, quantity: parseInt(qty, 10) || 1 }
        }).filter(item => item.slug)
      } else {
        // Legacy base64 format - try to decode
        try {
          const decoded = atob(shareParam)
          const legacyItems = JSON.parse(decoded) as Array<{ p: number, v?: number, q: number }>
          // For legacy format, we need to fetch by product ID
          for (const item of legacyItems) {
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

      if (items.length === 0) return false

      // Import all items in one server request
      await $fetch('/api/public/cart/import', {
        method: 'POST',
        body: { items }
      })

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
