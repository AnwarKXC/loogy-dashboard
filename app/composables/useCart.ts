import { computed } from 'vue'
import { useState } from '#app'

export interface CartLine {
  title: string
  price: number
  quantity: number
  image?: string
  productId?: number | string
  variantId?: number | string
}

export const useCart = () => {
  const lines = useState<CartLine[]>('cart:lines', () => [])
  const initialized = useState<boolean>('cart:initialized', () => false)
  const loading = useState<boolean>('cart:loading', () => false)

  const refresh = async () => {
    if (loading.value) return
    loading.value = true
    try {
      const response = await $fetch<{ items: Array<{
        productId: number
        variantId?: number | null
        quantity: number
        name: string
        price: number
        image?: string | null
      }>; subtotal: number }>('/api/public/cart')

      lines.value = (response.items || []).map(item => ({
        title: item.name,
        price: item.price,
        quantity: item.quantity,
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

  const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.price * line.quantity, 0))

  return { lines, add, updateQty, remove, clear, subtotal, refresh, loading }
}
