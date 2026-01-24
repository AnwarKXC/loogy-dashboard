<script setup lang="ts">
import { getDeliveryEstimate, getAvailabilityBadgeColor, getAvailabilityIcon } from '~/utils/whatsapp'
import type { ProductAvailabilityType } from '~/types'

definePageMeta({
  layout: 'storefront'
})

const { t, locale } = useI18n()
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
const {
  lines,
  subtotal,
  updateQty,
  remove,
  loading,
  getShareableCartUrl,
  importSharedCart,
  isEmpty,
  // Availability splits
  inStockItems,
  arrivingSoonItems,
  preOrderItems,
  checkoutItems,
  checkoutSubtotal,
  // Flags
  hasPreOrderItems,
  hasCheckoutItems,
  hasMixedAvailability,
  // Shipping calculation
  calculateShippingCost,
  // WhatsApp
  getPreOrderWhatsAppUrl
} = useCart()

// Split shipment preference (only relevant when mixed availability)
const splitShipment = ref(true)

// Store phone for WhatsApp
const storePhone = ref('+201000000000') // TODO: Fetch from store settings

// WhatsApp URL for pre-order items
const preOrderWhatsAppUrl = computed(() => {
  if (!hasPreOrderItems.value || !import.meta.client) return null
  return getPreOrderWhatsAppUrl(storePhone.value, window.location.origin)
})

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

// Free shipping if threshold reached (based on checkout items only, not pre-order)
const qualifiesForFreeShipping = computed(() => {
  if (pricing.value.freeShippingThreshold && checkoutSubtotal.value >= pricing.value.freeShippingThreshold) {
    return true
  }
  return false
})

// Shipping with split shipment consideration
const baseShipping = computed(() => qualifiesForFreeShipping.value ? 0 : pricing.value.shippingFee)
const shipping = computed(() => {
  if (qualifiesForFreeShipping.value) return 0
  return calculateShippingCost(pricing.value.shippingFee, splitShipment.value)
})

// Bulk discount calculation (based on checkout items only)
const bulkDiscount = computed(() => {
  if (
    pricing.value.bulkDiscountEnabled
    && pricing.value.bulkDiscountThreshold
    && pricing.value.bulkDiscountPercent
    && checkoutSubtotal.value >= pricing.value.bulkDiscountThreshold
  ) {
    return checkoutSubtotal.value * (pricing.value.bulkDiscountPercent / 100)
  }
  return 0
})

// Amount remaining for free shipping (based on checkout items)
const amountToFreeShipping = computed(() => {
  if (!pricing.value.freeShippingThreshold) return null
  if (qualifiesForFreeShipping.value) return null
  return pricing.value.freeShippingThreshold - checkoutSubtotal.value
})

// Amount remaining for bulk discount (based on checkout items)
const amountToBulkDiscount = computed(() => {
  if (!pricing.value.bulkDiscountEnabled || !pricing.value.bulkDiscountThreshold) return null
  if (checkoutSubtotal.value >= pricing.value.bulkDiscountThreshold) return null
  return pricing.value.bulkDiscountThreshold - checkoutSubtotal.value
})

// Total for checkout items only (pre-order items are not included)
const total = computed(() => checkoutSubtotal.value - bulkDiscount.value + shipping.value)

// Check if cart only has pre-order items (cannot checkout)
const onlyPreOrderItems = computed(() => hasPreOrderItems.value && !hasCheckoutItems.value)

// Get availability badge for an item
const getAvailabilityDisplay = (item: { availabilityType?: string, expectedArrivalDate?: string | null }) => {
  const type = (item.availabilityType || 'IN_STOCK_EGYPT') as ProductAvailabilityType
  const estimate = getDeliveryEstimate(type, item.expectedArrivalDate, locale.value as 'en' | 'ar')
  return {
    type,
    color: getAvailabilityBadgeColor(type),
    icon: getAvailabilityIcon(type),
    ...estimate
  }
}

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
            <div v-if="lines.length > 0" class="space-y-12">
              <!-- IN STOCK SECTION -->
              <section v-if="inStockItems.length > 0">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-500">
                  <UIcon name="i-lucide-package-check" class="w-5 h-5 text-green-600" />
                  <h2 class="text-lg font-bold uppercase tracking-wide text-green-700">
                    Ready to Ship
                  </h2>
                  <span class="text-sm text-green-600 font-medium">(2-4 days delivery)</span>
                </div>
                <div class="space-y-6">
                  <div
                    v-for="item in inStockItems"
                    :key="`instock-${item.productId}-${item.variantId ?? 'default'}`"
                    class="flex flex-col sm:flex-row gap-6 pb-6 border-b border-neutral-200"
                  >
                    <div class="w-full sm:w-32 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img :src="item.image || fallbackImage" class="w-full h-full object-cover" :alt="item.title">
                    </div>
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
                        <div class="flex items-center gap-2">
                          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <UIcon name="i-lucide-check-circle" class="w-3 h-3" />
                            In Stock Egypt
                          </span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center mt-6">
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
                        <button class="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors" @click="removeItem(item)">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- ARRIVING SOON SECTION -->
              <section v-if="arrivingSoonItems.length > 0">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-500">
                  <UIcon name="i-lucide-truck" class="w-5 h-5 text-amber-600" />
                  <h2 class="text-lg font-bold uppercase tracking-wide text-amber-700">
                    Arriving Soon
                  </h2>
                  <span class="text-sm text-amber-600 font-medium">(1-2 weeks)</span>
                </div>
                <div class="space-y-6">
                  <div
                    v-for="item in arrivingSoonItems"
                    :key="`arriving-${item.productId}-${item.variantId ?? 'default'}`"
                    class="flex flex-col sm:flex-row gap-6 pb-6 border-b border-neutral-200"
                  >
                    <div class="w-full sm:w-32 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img :src="item.image || fallbackImage" class="w-full h-full object-cover" :alt="item.title">
                    </div>
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
                        <div class="flex items-center gap-2">
                          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <UIcon name="i-lucide-clock" class="w-3 h-3" />
                            {{ getAvailabilityDisplay(item).text }}
                            <template v-if="getAvailabilityDisplay(item).days">
                              · {{ getAvailabilityDisplay(item).days }}
                            </template>
                          </span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center mt-6">
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
                        <button class="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors" @click="removeItem(item)">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- SPLIT SHIPMENT OPTION (when mixed availability) -->
              <div v-if="hasMixedAvailability" class="bg-gradient-to-r from-amber-50 to-green-50 p-6 rounded-2xl border border-amber-200">
                <h3 class="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <UIcon name="i-lucide-split" class="w-5 h-5" />
                  Shipping Options
                </h3>
                <div class="space-y-3">
                  <label class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors" :class="splitShipment ? 'bg-white shadow-sm border border-amber-300' : 'hover:bg-white/50'">
                    <input
                      v-model="splitShipment"
                      type="radio"
                      :value="true"
                      class="mt-1 text-amber-600 focus:ring-amber-500"
                    >
                    <div>
                      <div class="font-medium text-neutral-800">Ship separately</div>
                      <div class="text-sm text-neutral-600">
                        Get in-stock items now, arriving items later
                        <span class="font-medium text-amber-700">(1.5× shipping)</span>
                      </div>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors" :class="!splitShipment ? 'bg-white shadow-sm border border-green-300' : 'hover:bg-white/50'">
                    <input
                      v-model="splitShipment"
                      type="radio"
                      :value="false"
                      class="mt-1 text-green-600 focus:ring-green-500"
                    >
                    <div>
                      <div class="font-medium text-neutral-800">Ship together</div>
                      <div class="text-sm text-neutral-600">
                        Wait for all items to be ready
                        <span class="font-medium text-green-700">(1× shipping)</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- PRE-ORDER SECTION -->
              <section v-if="preOrderItems.length > 0">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-500">
                  <UIcon name="i-lucide-calendar-clock" class="w-5 h-5 text-blue-600" />
                  <h2 class="text-lg font-bold uppercase tracking-wide text-blue-700">
                    Pre-Order Items
                  </h2>
                  <span class="text-sm text-blue-600 font-medium">(Contact us to order)</span>
                </div>

                <!-- Pre-order notice -->
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p class="text-sm text-blue-800">
                    <strong>Note:</strong> Pre-order items cannot be checked out directly.
                    Please contact us via WhatsApp to place your order. We'll confirm availability and pricing.
                  </p>
                </div>

                <div class="space-y-6">
                  <div
                    v-for="item in preOrderItems"
                    :key="`preorder-${item.productId}-${item.variantId ?? 'default'}`"
                    class="flex flex-col sm:flex-row gap-6 pb-6 border-b border-neutral-200"
                  >
                    <div class="w-full sm:w-32 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img :src="item.image || fallbackImage" class="w-full h-full object-cover" :alt="item.title">
                    </div>
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
                        <div class="flex items-center gap-2">
                          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <UIcon name="i-lucide-message-circle" class="w-3 h-3" />
                            Pre-Order Only
                          </span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center mt-6">
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
                        <button class="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors" @click="removeItem(item)">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- WhatsApp Pre-Order Button -->
                <a
                  v-if="preOrderWhatsAppUrl"
                  :href="preOrderWhatsAppUrl"
                  target="_blank"
                  class="mt-6 w-full py-4 bg-green-600 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <UIcon name="i-simple-icons-whatsapp" class="w-5 h-5" />
                  Inquire on WhatsApp
                </a>
              </section>
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

              <!-- Pre-order only notice -->
              <div v-if="onlyPreOrderItems" class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p class="text-sm text-blue-800 text-center">
                  <UIcon name="i-lucide-info" class="w-4 h-4 inline-block mr-1" />
                  Your cart only contains pre-order items.<br>
                  Please contact us via WhatsApp to place your order.
                </p>
              </div>

              <div v-if="hasCheckoutItems" class="space-y-4 mb-8">
                <!-- Checkout Items Subtotal -->
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">Subtotal ({{ checkoutItems.length }} items)</span>
                  <span class="font-bold">{{ formatPrice(checkoutSubtotal) }}</span>
                </div>

                <!-- Pre-order note if mixed -->
                <div v-if="hasPreOrderItems" class="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  <UIcon name="i-lucide-info" class="w-3 h-3 inline-block mr-1" />
                  Pre-order items ({{ formatPrice(subtotal - checkoutSubtotal) }}) not included in checkout
                </div>

                <!-- Bulk Discount -->
                <div v-if="bulkDiscount > 0" class="flex justify-between text-sm text-green-600">
                  <span>Bulk Discount ({{ pricing.bulkDiscountPercent }}%)</span>
                  <span class="font-bold">-{{ formatPrice(bulkDiscount) }}</span>
                </div>

                <!-- Shipping -->
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">
                    Shipping
                    <span v-if="hasMixedAvailability && splitShipment" class="text-xs text-amber-600">(split)</span>
                  </span>
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

              <div v-if="hasCheckoutItems" class="flex justify-between items-center pt-6 border-t border-neutral-100 mb-8">
                <span class="text-lg font-bold uppercase">Total</span>
                <span class="text-2xl font-serif font-bold">{{ formatPrice(total) }}</span>
              </div>

              <!-- Checkout Button -->
              <NuxtLink
                v-if="hasCheckoutItems"
                to="/checkout"
                :class="[
                  'w-full py-4 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center justify-center transition-colors',
                  'bg-neutral-900 text-white hover:bg-amber-700'
                ]"
              >
                Checkout
              </NuxtLink>

              <!-- WhatsApp button for pre-order only cart -->
              <a
                v-else-if="onlyPreOrderItems && preOrderWhatsAppUrl"
                :href="preOrderWhatsAppUrl"
                target="_blank"
                class="w-full py-4 bg-green-600 text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
              >
                <UIcon name="i-simple-icons-whatsapp" class="w-5 h-5" />
                Inquire on WhatsApp
              </a>

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
