// @ts-nocheck
<script setup lang="ts">
import { computed, reactive } from 'vue'
// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const items = reactive([
  { title: 'Minimal Chair', price: 1099, quantity: 1, image: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400' },
  { title: 'Desk Lamp', price: 799, quantity: 2, image: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=400' }
])

const subtotal = computed(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0))
const shipping = 80
const total = computed(() => subtotal.value + shipping)
</script>

<template>
  <UContainer class="py-12 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold">
        Shopping Cart
      </h1>
      <UCard v-for="item in items" :key="item.title" class="flex items-center gap-4">
        <img
          :src="item.image"
          :alt="item.title"
          class="size-20 rounded-lg object-cover"
          loading="lazy"
        >
        <div class="flex-1 space-y-1">
          <p class="font-semibold">
            {{ item.title }}
          </p>
          <p class="text-muted">
            {{ item.price }} EGP
          </p>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-minus"
              size="xs"
              variant="ghost"
              @click="item.quantity = Math.max(1, item.quantity - 1)"
            />
            <span>{{ item.quantity }}</span>
            <UButton
              icon="i-lucide-plus"
              size="xs"
              variant="ghost"
              @click="item.quantity++"
            />
          </div>
        </div>
        <UButton icon="i-lucide-trash" variant="ghost" color="error" />
      </UCard>
    </div>

    <UCard class="h-fit space-y-4">
      <h2 class="text-lg font-semibold">
        Order Summary
      </h2>
      <div class="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{{ subtotal }} EGP</span>
      </div>
      <div class="flex justify-between text-sm">
        <span>Shipping</span>
        <span>{{ shipping }} EGP</span>
      </div>
      <UDivider />
      <div class="flex justify-between font-semibold">
        <span>Total</span>
        <span>{{ total }} EGP</span>
      </div>
      <UButton block color="primary" to="/checkout">
        Checkout
      </UButton>
      <UButton block variant="ghost" to="/products">
        Continue shopping
      </UButton>
    </UCard>
  </UContainer>
</template>
