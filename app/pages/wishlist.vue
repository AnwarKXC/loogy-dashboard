<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const { items, remove, clear } = useWishlist()
const { add: addToCart } = useCart()
const toast = useToast()

const hasItems = computed(() => items.value.length > 0)

const formatPrice = (value: number) => new Intl.NumberFormat('ar-EG', { style: 'decimal' }).format(value) + ' EGP'

const handleAddToCart = (item: any) => {
  addToCart({
    title: item.title,
    price: item.price,
    quantity: 1,
    image: item.image,
    productId: item.productId,
    variantId: item.variantId
  })
  toast.add({ title: 'تمت الإضافة للسلة', color: 'success' })
}
</script>

<template>
  <UContainer class="py-12 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        المفضلة
      </h1>
      <UButton
        :disabled="!hasItems"
        variant="ghost"
        color="error"
        icon="i-lucide-trash"
        @click="clear"
      >
        مسح الكل
      </UButton>
    </div>

    <div v-if="hasItems" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="item in items"
        :key="`${item.productId || item.title}-${item.variantId || 'default'}`"
        class="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <UButton
          variant="ghost"
          size="xs"
          color="error"
          icon="i-lucide-x"
          class="absolute right-2 top-2 z-10"
          aria-label="إزالة من المفضلة"
          @click="remove(item.productId, item.variantId)"
        />

        <div class="space-y-3">
          <NuxtLink :to="`/products/${item.productId}`" class="block space-y-2">
            <div class="aspect-square rounded-md bg-gradient-to-br from-slate-100 to-white dark:from-gray-800 dark:to-gray-700 overflow-hidden">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="h-full w-full object-cover"
                loading="lazy"
              >
              <div v-else class="flex h-full items-center justify-center text-gray-500 dark:text-gray-300 text-sm">
                {{ item.title }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-gray-900 dark:text-gray-100">
                {{ item.title }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatPrice(item.price) }}
              </p>
            </div>
          </NuxtLink>

          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              block
              icon="i-lucide-shopping-cart"
              @click="handleAddToCart(item)"
            >
              أضف للسلة
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <UCard v-else class="py-12 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="space-y-2">
        <UIcon name="i-lucide-heart" class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
        <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          قائمة المفضلة فارغة
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          احفظ المنتجات التي تعجبك للعودة إليها لاحقاً.
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <UButton to="/products" color="primary" icon="i-lucide-shopping-bag">
            تصفح المنتجات
          </UButton>
          <UButton to="/" variant="ghost">
            الرئيسية
          </UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
