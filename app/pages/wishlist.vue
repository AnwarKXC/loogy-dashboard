<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

const fallbackImage = 'https://placehold.co/600x750/f3f4f6/171717?text=Product'

type WishlistItem = {
  productId: number
  variantId?: number | null
  name: string
  slug: string
  price: number
  salePrice?: number | null
  image?: string | null
  inStock: boolean
}

const { data, pending, refresh } = await useFetch<{ items: WishlistItem[] }>('/api/public/wishlist')

const wishlistItems = computed<WishlistItem[]>(() => data.value?.items ?? [])

const removeItem = async (item: { productId: number, variantId?: number | null }) => {
  await $fetch('/api/public/wishlist', {
    method: 'DELETE',
    body: {
      productId: item.productId,
      variantId: item.variantId ?? undefined
    }
  })

  await refresh()
}

const addToCart = async (item: { productId: number, variantId?: number | null }) => {
  await $fetch('/api/public/cart', {
    method: 'POST',
    body: {
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      quantity: 1
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
        <div class="flex justify-between items-end mb-16">
          <h1 class="text-5xl lg:text-7xl font-serif font-black uppercase leading-none">
            Wishlist
          </h1>
          <p class="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-2">
            {{ wishlistItems.length }} Items Saved
          </p>
        </div>

        <div v-if="wishlistItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          <div v-for="item in wishlistItems" :key="`${item.productId}-${item.variantId ?? 'default'}`" class="group relative">
            <!-- Card -->
            <div class="aspect-[4/5] bg-neutral-200 overflow-hidden mb-4 relative">
              <img
                :src="item.image || fallbackImage"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter"
                :class="!item.inStock ? 'grayscale opacity-70' : ''"
                :alt="item.name"
              >

              <button class="absolute top-4 right-4 text-black/70 hover:bg-red-500 hover:text-white cursor-pointer transition-colors z-10 grid place-content-center bg-white/80 rounded-full size-8" @click="removeItem(item)">
                <UIcon name="i-heroicons-x-mark" class="size-5 " />
              </button>

              <div v-if="!item.inStock" class="absolute inset-0 flex items-center justify-center">
                <span class="bg-black/70 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">Out of Stock</span>
              </div>

              <button v-else class="absolute bottom-0 inset-x-0 h-12 bg-white flex items-center justify-center text-xs font-bold uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition-transform duration-300 hover:bg-black hover:text-white" @click="addToCart(item)">
                Add To Cart
              </button>
            </div>

            <!-- Info -->
            <div class="flex justify-between items-start">
              <h3 class="text-sm font-bold uppercase tracking-wide max-w-[70%]">
                {{ item.name }}
              </h3>
              <span class="font-serif font-medium">${{ item.price.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="py-32 text-center">
          <div class="mb-6">
            <UIcon name="i-heroicons-heart" class="w-16 h-16 text-neutral-200 mx-auto" />
          </div>
          <p class="text-xl font-serif mb-8 text-neutral-500">
            {{ pending ? 'Loading wishlist…' : 'Your wishlist is currently empty.' }}
          </p>
          <NuxtLink to="/" class="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-neutral-800 transition-colors">
            <span>Explore Collection</span>
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
