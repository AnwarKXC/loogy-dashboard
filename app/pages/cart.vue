<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'عربة التسوق',
  description: 'راجع منتجاتك في السلة واستكمل عملية الشراء.',
  robots: 'noindex, nofollow'
})

const fallbackImage = 'https://placehold.co/600x750/f3f4f6/171717?text=Product'

type CartItem = {
  productId: number
  variantId?: number | null
  quantity: number
  name: string
  slug: string
  price: number
  salePrice?: number | null
  image?: string | null
}

type PricingSettings = {
  shippingFee: number
  freeShippingThreshold: number | null
  minOrderValue: number | null
  maxOrderValue: number | null
  bulkDiscountEnabled: boolean
  bulkDiscountThreshold: number | null
  bulkDiscountPercent: number | null
}

const { data, pending, refresh } = await useFetch<{ items: CartItem[], subtotal: number }>('/api/public/cart')
const { data: pricingData } = await useFetch<PricingSettings>('/api/public/pricing')

const cartItems = computed<CartItem[]>(() => data.value?.items ?? [])
const subtotal = computed(() => data.value?.subtotal ?? 0)

// Dynamic pricing from settings
const pricing = computed(() => pricingData.value ?? {
  shippingFee: 15.00,
  freeShippingThreshold: null,
  minOrderValue: null,
  maxOrderValue: null,
  bulkDiscountEnabled: false,
  bulkDiscountThreshold: null,
  bulkDiscountPercent: null
})

// Free shipping if threshold reached
const qualifiesForFreeShipping = computed(() => {
  if (pricing.value.freeShippingThreshold && subtotal.value >= pricing.value.freeShippingThreshold) {
    return true
  }
  return false
})

const shipping = computed(() => qualifiesForFreeShipping.value ? 0 : pricing.value.shippingFee)

// Bulk discount calculation
const bulkDiscount = computed(() => {
  if (
    pricing.value.bulkDiscountEnabled
    && pricing.value.bulkDiscountThreshold
    && pricing.value.bulkDiscountPercent
    && subtotal.value >= pricing.value.bulkDiscountThreshold
  ) {
    return subtotal.value * (pricing.value.bulkDiscountPercent / 100)
  }
  return 0
})

// Amount remaining for free shipping
const amountToFreeShipping = computed(() => {
  if (!pricing.value.freeShippingThreshold) return null
  if (qualifiesForFreeShipping.value) return null
  return pricing.value.freeShippingThreshold - subtotal.value
})

// Amount remaining for bulk discount
const amountToBulkDiscount = computed(() => {
  if (!pricing.value.bulkDiscountEnabled || !pricing.value.bulkDiscountThreshold) return null
  if (subtotal.value >= pricing.value.bulkDiscountThreshold) return null
  return pricing.value.bulkDiscountThreshold - subtotal.value
})

const total = computed(() => subtotal.value - bulkDiscount.value + shipping.value)

const updateQuantity = async (item: { productId: number, variantId?: number | null, quantity: number }, nextQty: number) => {
  if (nextQty < 1) return

  await $fetch('/api/public/cart', {
    method: 'PATCH',
    body: {
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      quantity: nextQty
    }
  })

  await refresh()
}

const removeItem = async (item: { productId: number, variantId?: number | null }) => {
  await $fetch('/api/public/cart', {
    method: 'DELETE',
    body: {
      productId: item.productId,
      variantId: item.variantId ?? undefined
    }
  })

  await refresh()
}
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <!-- Main Content -->
    <main class="flex-grow pt-12 pb-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl lg:text-7xl font-serif font-black uppercase leading-none mb-16">
          Cart
        </h1>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          <!-- Cart Items List -->
          <div class="lg:col-span-8">
            <div v-if="cartItems.length > 0" class="space-y-8">
              <div
                v-for="item in cartItems"
                :key="`${item.productId}-${item.variantId ?? 'default'}`"
                class="flex flex-col sm:flex-row gap-6 pb-8 border-b border-neutral-200"
              >
                <!-- Image -->
                <div class="w-full sm:w-32 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <img :src="item.image || fallbackImage" class="w-full h-full object-cover" :alt="item.name">
                </div>

                <!-- Details -->
                <div class="flex-grow flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="text-lg font-bold uppercase tracking-wide">
                        {{ item.name }}
                      </h3>
                      <p class="font-serif font-medium text-lg">
                        ${{ item.price.toFixed(2) }}
                      </p>
                    </div>
                    <p class="text-sm text-green-600 font-medium">
                      In Stock
                    </p>
                  </div>

                  <div class="flex justify-between items-center mt-6">
                    <!-- Qty -->
                    <div class="flex items-center border border-neutral-200 rounded-full h-10 w-32">
                      <button class="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-l-full" @click="updateQuantity(item, item.quantity - 1)">
                        <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                      </button>
                      <input
                        type="text"
                        :value="item.quantity"
                        readonly
                        class="w-12 text-center text-sm font-bold bg-transparent border-none p-0 focus:ring-0"
                      >
                      <button class="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-r-full" @click="updateQuantity(item, item.quantity + 1)">
                        <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                      </button>
                    </div>

                    <!-- Remove -->
                    <button class="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors" @click="removeItem(item)">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-24">
              <p class="text-neutral-500 mb-8">
                {{ pending ? 'Loading cart…' : 'Your cart is empty.' }}
              </p>
              <NuxtLink to="/" class="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">
                Start Shopping
              </NuxtLink>
            </div>
          </div>

          <!-- Summary -->
          <div class="lg:col-span-4">
            <div class="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm sticky top-32">
              <h3 class="text-xl font-bold uppercase tracking-wide mb-8">
                Order Summary
              </h3>

              <div class="space-y-4 mb-8">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">Subtotal</span>
                  <span class="font-bold">${{ subtotal.toFixed(2) }}</span>
                </div>

                <!-- Bulk Discount -->
                <div v-if="bulkDiscount > 0" class="flex justify-between text-sm text-green-600">
                  <span>Bulk Discount ({{ pricing.bulkDiscountPercent }}%)</span>
                  <span class="font-bold">-${{ bulkDiscount.toFixed(2) }}</span>
                </div>

                <!-- Shipping -->
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">Shipping</span>
                  <span v-if="qualifiesForFreeShipping" class="font-bold text-green-600">FREE</span>
                  <span v-else class="font-bold">${{ shipping.toFixed(2) }}</span>
                </div>

                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">Tax</span>
                  <span class="font-bold text-neutral-400">Calculated at checkout</span>
                </div>

                <!-- Threshold hints -->
                <div v-if="amountToFreeShipping && amountToFreeShipping > 0" class="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  Add ${{ amountToFreeShipping.toFixed(2) }} more for free shipping!
                </div>
                <div v-if="amountToBulkDiscount && amountToBulkDiscount > 0" class="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  Add ${{ amountToBulkDiscount.toFixed(2) }} more for {{ pricing.bulkDiscountPercent }}% bulk discount!
                </div>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-neutral-100 mb-8">
                <span class="text-lg font-bold uppercase">Total</span>
                <span class="text-2xl font-serif font-bold">${{ total.toFixed(2) }}</span>
              </div>

              <NuxtLink
                to="/checkout"
                class="w-full bg-neutral-900 text-white py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors mb-4 inline-flex items-center justify-center"
              >
                Checkout
              </NuxtLink>

              <div class="flex justify-center gap-4 text-neutral-300">
                <UIcon name="i-simple-icons-visa" class="w-8 h-8" />
                <UIcon name="i-simple-icons-mastercard" class="w-8 h-8" />
                <UIcon name="i-simple-icons-paypal" class="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
