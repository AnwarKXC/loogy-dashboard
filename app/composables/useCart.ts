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

  const add = (line: CartLine) => {
    const existing = lines.value.find(l => l.productId === line.productId && l.variantId === line.variantId)
    if (existing) {
      existing.quantity += line.quantity
      return
    }
    lines.value.push(line)
  }

  const updateQty = (productId: CartLine['productId'], variantId: CartLine['variantId'], quantity: number) => {
    const target = lines.value.find(l => l.productId === productId && l.variantId === variantId)
    if (target) {
      target.quantity = Math.max(1, quantity)
    }
  }

  const remove = (productId: CartLine['productId'], variantId: CartLine['variantId']) => {
    lines.value = lines.value.filter(l => l.productId !== productId || l.variantId !== variantId)
  }

  const clear = () => {
    lines.value = []
  }

  const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.price * line.quantity, 0))

  return { lines, add, updateQty, remove, clear, subtotal }
}
