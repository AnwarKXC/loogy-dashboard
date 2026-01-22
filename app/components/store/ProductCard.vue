<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  price: number
  image?: string
  salePrice?: number
  rating?: number
  to?: string
  productId?: number | string
  variantId?: number | string
}>()

const { add: addToCart } = useCart()
const { items: wishlistItems, add: addToWishlist, remove: removeFromWishlist } = useWishlist()

const isInWishlist = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wishlistItems.value.some((item: any) =>
    item.productId === props.productId && item.variantId === props.variantId
  )
)

const _handleAddToCart = async () => {
  await addToCart({
    title: props.title,
    price: props.salePrice ?? props.price,
    quantity: 1,
    image: props.image,
    productId: props.productId,
    variantId: props.variantId
  })
}

const handleToggleWishlist = async () => {
  if (isInWishlist.value) {
    await removeFromWishlist(props.productId, props.variantId)
  } else {
    await addToWishlist({
      title: props.title,
      price: props.price,
      image: props.image,
      productId: props.productId,
      variantId: props.variantId
    })
  }
}

const discountPercent = computed(() => {
  if (!props.salePrice || props.salePrice >= props.price) return null
  return Math.round(((props.price - props.salePrice) / props.price) * 100)
})

const formatPrice = (value: number) => `${value.toLocaleString('en-US')} EGP`
</script>

<template>
  <UCard
    class="group h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
  >
    <template #header>
      <NuxtLink :to="props.to || '#'" class="block relative">
        <div class="aspect-square bg-gray-50 dark:bg-gray-700 overflow-hidden">
          <img
            v-if="props.image"
            :src="props.image"
            :alt="props.title"
            class="w-full h-full object-contain p-2"
            loading="lazy"
          >
          <div v-else class="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
            <UIcon name="i-lucide-image" class="size-12" />
          </div>
        </div>

        <div
          v-if="discountPercent"
          class="absolute top-2 left-2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded"
        >
          {{ discountPercent.toFixed(2) }}%
        </div>

        <button
          class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm opacity-0 group-hover:opacity-100"
          @click.prevent="handleToggleWishlist"
        >
          <UIcon
            :name="isInWishlist ? 'i-lucide-heart' : 'i-lucide-heart'"
            class="size-5"
            :class="{ 'fill-red-500 text-red-500': isInWishlist }"
          />
        </button>
      </NuxtLink>
    </template>

    <div class="space-y-2 text-right px-2 py-1" dir="rtl">
      <NuxtLink :to="props.to || '#'" class="block">
        <p class="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm leading-snug hover:text-primary transition-colors">
          {{ props.title }}
        </p>
      </NuxtLink>

      <div class="flex items-center justify-start gap-2 flex-row-reverse">
        <span class="text-primary font-bold text-lg">
          {{ formatPrice(props.salePrice ?? props.price) }}
        </span>
        <span v-if="props.salePrice" class="text-gray-400 dark:text-gray-500 line-through text-sm">
          {{ formatPrice(props.price) }}
        </span>
      </div>
    </div>
  </UCard>
</template>
