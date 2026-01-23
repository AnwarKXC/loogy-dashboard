<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

const { t } = useI18n()
const route = useRoute()
const toast = useToast()

useSeoMeta({
  title: 'Shopping Cart',
  description: 'Review your cart items and complete your purchase.',
  robots: 'noindex, nofollow'
})

const fallbackImage = 'https://placehold.co/600x750/f3f4f6/171717?text=Product'

type PricingSettings = {
  shippingFee: number
  freeShippingThreshold: number | null
  minOrderValue: number | null
  maxOrderValue: number | null
  bulkDiscountEnabled: boolean
  bulkDiscountThreshold: number | null
  bulkDiscountPercent: number | null
}

// Use the cart composable for shared state
const { lines, subtotal, updateQty, remove, loading, getShareableCartUrl, importSharedCart, isEmpty } = useCart()
const { data: pricingData } = await useFetch<PricingSettings>('/api/public/pricing')

// Handle shared cart import from URL
const shareImported = ref(false)
const importing = ref(false)

onMounted(async () => {
  // Support both new format (?items=slug:qty) and legacy format (?share=base64)
  const itemsParam = route.query.items as string
  const shareCode = route.query.share as string
  const shareParam = itemsParam || shareCode

  if (shareParam && !shareImported.value) {
    shareImported.value = true
    importing.value = true

    try {
      const success = await importSharedCart(shareParam)
      if (success) {
        toast.add({
          title: t('cart.shareImported') || 'Cart imported',
          description: t('cart.shareImportedDesc') || 'Items from shared cart have been added',
          color: 'success'
        })
      }
    } finally {
      importing.value = false
    }

    // Remove share params from URL
    navigateTo('/cart', { replace: true })
  }
})

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

const updateQuantity = async (item: { productId?: number | string, variantId?: number | string, quantity: number }, nextQty: number) => {
  if (nextQty < 1) return
  await updateQty(item.productId, item.variantId, nextQty)
}

const removeItem = async (item: { productId?: number | string, variantId?: number | string }) => {
  await remove(item.productId, item.variantId)
}

// Share cart functionality
const shareUrl = computed(() => getShareableCartUrl())

const copyShareLink = async () => {
  if (shareUrl.value) {
    await navigator.clipboard.writeText(shareUrl.value)
    toast.add({
      title: t('cart.linkCopied') || 'Link copied',
      description: t('cart.linkCopiedDesc') || 'Share this link with others',
      color: 'success'
    })
  }
}

// Native share API
const canNativeShare = computed(() => {
  if (import.meta.client && navigator.share) {
    return true
  }
  return false
})

const nativeShare = async () => {
  if (shareUrl.value && navigator.share) {
    try {
      await navigator.share({
        title: t('cart.shareTitle') || 'My Shopping Cart',
        text: t('cart.shareText') || 'Check out the items in my cart!',
        url: shareUrl.value
      })
    } catch (err) {
      // User cancelled or share failed - fall back to copy
      if ((err as Error).name !== 'AbortError') {
        await copyShareLink()
      }
    }
  } else {
    await copyShareLink()
  }
}

// Format price helper
const formatPrice = (value: number) => {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`
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
            <div v-if="lines.length > 0" class="space-y-8">
              <div
                v-for="item in lines"
                :key="`${item.productId}-${item.variantId ?? 'default'}`"
                class="flex flex-col sm:flex-row gap-6 pb-8 border-b border-neutral-200"
              >
                <!-- Image -->
                <div class="w-full sm:w-32 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <img :src="item.image || fallbackImage" class="w-full h-full object-cover" :alt="item.title">
                </div>

                <!-- Details -->
                <div class="flex-grow flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="text-lg font-bold uppercase tracking-wide">
                        {{ item.title }}
                      </h3>
                      <p class="font-serif font-medium text-lg">
                        {{ formatPrice(item.price) }}
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

            <!-- Importing shared cart loading -->
            <div v-else-if="importing" class="text-center py-24">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-4" />
              <p class="text-neutral-500">
                Importing shared cart...
              </p>
            </div>

            <div v-else class="text-center py-24">
              <p class="text-neutral-500 mb-8">
                {{ loading ? 'Loading cart…' : 'Your cart is empty.' }}
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
                  <span class="font-bold">{{ formatPrice(subtotal) }}</span>
                </div>

                <!-- Bulk Discount -->
                <div v-if="bulkDiscount > 0" class="flex justify-between text-sm text-green-600">
                  <span>Bulk Discount ({{ pricing.bulkDiscountPercent }}%)</span>
                  <span class="font-bold">-{{ formatPrice(bulkDiscount) }}</span>
                </div>

                <!-- Shipping -->
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">Shipping</span>
                  <span v-if="qualifiesForFreeShipping" class="font-bold text-green-600">FREE</span>
                  <span v-else class="font-bold">{{ formatPrice(shipping) }}</span>
                </div>

                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">Tax</span>
                  <span class="font-bold text-neutral-400">Calculated at checkout</span>
                </div>

                <!-- Threshold hints -->
                <div v-if="amountToFreeShipping && amountToFreeShipping > 0" class="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  Add {{ formatPrice(amountToFreeShipping) }} more for free shipping!
                </div>
                <div v-if="amountToBulkDiscount && amountToBulkDiscount > 0" class="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  Add {{ formatPrice(amountToBulkDiscount) }} more for {{ pricing.bulkDiscountPercent }}% bulk discount!
                </div>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-neutral-100 mb-8">
                <span class="text-lg font-bold uppercase">Total</span>
                <span class="text-2xl font-serif font-bold">{{ formatPrice(total) }}</span>
              </div>

              <NuxtLink
                to="/checkout"
                :class="[
                  'w-full py-4 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center justify-center transition-colors',
                  isEmpty ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-amber-700'
                ]"
                :tabindex="isEmpty ? -1 : 0"
                @click.prevent="isEmpty ? null : $router.push('/checkout')"
              >
                Checkout
              </NuxtLink>

              <!-- Share Cart Buttons -->
              <div v-if="!isEmpty" class="flex gap-2 mb-4">
                <button
                  class="flex-1 py-3 border border-neutral-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                  @click="copyShareLink"
                >
                  <UIcon name="i-lucide-copy" class="w-4 h-4" />
                  Copy Link
                </button>
                <button
                  v-if="canNativeShare"
                  class="flex-1 py-3 bg-neutral-800 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                  @click="nativeShare"
                >
                  <UIcon name="i-lucide-share-2" class="w-4 h-4" />
                  Share
                </button>
              </div>

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
