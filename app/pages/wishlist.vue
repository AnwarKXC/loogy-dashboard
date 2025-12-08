<script setup lang="ts">
import { computed } from 'vue'

// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const { items, remove, clear } = useWishlist()

const hasItems = computed(() => items.value.length > 0)

const formatPrice = (value: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(value)
</script>

<template>
  <UContainer class="py-12 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        Wishlist
      </h1>
      <UButton
        :disabled="!hasItems"
        variant="ghost"
        icon="i-lucide-trash"
        @click="clear"
      >
        Clear
      </UButton>
    </div>

    <div v-if="hasItems" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="item in items"
        :key="`${item.productId || item.title}-${item.variantId || 'default'}`"
        class="relative"
      >
        <UButton
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          class="absolute right-2 top-2"
          aria-label="Remove from wishlist"
          @click="remove(item.productId, item.variantId)"
        />

        <div class="space-y-3">
          <NuxtLink :to="item.to || '/products'" class="block space-y-2">
            <div class="aspect-square rounded-md bg-gradient-to-br from-slate-100 to-white overflow-hidden">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="h-full w-full object-cover"
                loading="lazy"
              >
              <div v-else class="flex h-full items-center justify-center text-muted text-sm">
                {{ item.title }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <p class="font-semibold">
                {{ item.title }}
              </p>
              <p class="text-sm text-muted">
                {{ formatPrice(item.price) }}
              </p>
            </div>
          </NuxtLink>

          <div class="flex items-center gap-2">
            <UButton to="/cart" color="primary" block>
              Add to cart
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <UCard v-else class="py-12 text-center">
      <div class="space-y-2">
        <p class="text-lg font-semibold">
          Your wishlist is empty
        </p>
        <p class="text-muted">
          Save items you love and access them anytime.
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <UButton to="/products" color="primary">
            Browse products
          </UButton>
          <UButton to="/" variant="ghost">
            Go home
          </UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
