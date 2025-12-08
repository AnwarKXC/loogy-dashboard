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

const handleAddToCart = () => {
  addToCart({
    title: props.title,
    price: props.salePrice ?? props.price,
    quantity: 1,
    image: props.image,
    productId: props.productId,
    variantId: props.variantId
  })
}

const handleToggleWishlist = () => {
  if (isInWishlist.value) {
    removeFromWishlist(props.productId, props.variantId)
  } else {
    addToWishlist({
      title: props.title,
      price: props.price,
      image: props.image,
      productId: props.productId,
      variantId: props.variantId
    })
  }
}
</script>

<template>
  <UCard class="h-full">
    <template #header>
      <NuxtLink :to="props.to || '#'" class="block">
        <div class="aspect-square rounded-lg bg-gradient-to-br from-slate-100 to-white overflow-hidden">
          <img
            v-if="props.image"
            :src="props.image"
            :alt="props.title"
            class="w-full h-full object-cover"
            loading="lazy"
          >
          <div v-else class="flex h-full items-center justify-center text-muted text-sm">Image</div>
        </div>
      </NuxtLink>
    </template>

    <div class="space-y-1">
      <NuxtLink :to="props.to || '#'" class="font-semibold line-clamp-2 hover:text-primary">
        {{ props.title }}
      </NuxtLink>
      <div class="flex items-center gap-2">
        <p class="text-lg font-bold">
          {{ props.salePrice ?? props.price }} EGP
        </p>
        <p v-if="props.salePrice" class="text-muted line-through text-sm">
          {{ props.price }} EGP
        </p>
      </div>
      <div class="flex items-center gap-1 text-amber-500 text-sm">
        <UIcon name="i-lucide-star" />
        <span>{{ props.rating ?? '4.8' }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          block
          color="primary"
          icon="i-lucide-shopping-cart"
          @click="handleAddToCart"
        >
          Add to cart
        </UButton>
        <UButton
          :icon="isInWishlist ? 'i-lucide-heart-filled' : 'i-lucide-heart'"
          :color="isInWishlist ? 'primary' : undefined"
          variant="ghost"
          aria-label="Wishlist"
          @click="handleToggleWishlist"
        />
      </div>
    </template>
  </UCard>
</template>
