// @ts-nocheck
<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const { lines, updateQty, remove, subtotal } = useCart()
const shipping = ref(80)
const total = computed(() => subtotal.value + shipping.value)

const hasItems = computed(() => lines.value.length > 0)

const formatPrice = (value: number) => `${value.toLocaleString('ar-EG')} ج.م`
</script>

<template>
  <UContainer class="py-12 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8" dir="rtl">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          سلة التسوق
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ lines.length }} منتج
        </p>
      </div>

      <UCard v-if="!hasItems" class="text-center text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="py-8 space-y-4">
          <UIcon name="i-lucide-shopping-cart" class="size-16 mx-auto text-gray-300 dark:text-gray-600" />
          <p class="text-lg">
            لا توجد منتجات في السلة حالياً.
          </p>
          <UButton to="/products" color="primary" icon="i-lucide-shopping-bag">
            ابدأ التسوق
          </UButton>
        </div>
      </UCard>

      <template v-else>
        <UCard
          v-for="item in lines"
          :key="`${item.productId}-${item.variantId || 'default'}`"
          class="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <img
            :src="item.image || 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=400'"
            :alt="item.title"
            class="size-20 rounded-lg object-cover bg-gray-100 dark:bg-gray-700"
            loading="lazy"
          >
          <div class="flex-1 space-y-1">
            <p class="font-semibold text-gray-900 dark:text-gray-100">
              {{ item.title }}
            </p>
            <p class="text-primary font-bold">
              {{ formatPrice(item.price) }}
            </p>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-minus"
                size="xs"
                variant="soft"
                @click="updateQty(item.productId, item.variantId, Math.max(1, item.quantity - 1))"
              />
              <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                @click="updateQty(item.productId, item.variantId, item.quantity + 1)"
              />
            </div>
          </div>
          <UButton
            icon="i-lucide-trash"
            variant="ghost"
            color="error"
            aria-label="حذف"
            @click="remove(item.productId, item.variantId)"
          />
        </UCard>
      </template>
    </div>

    <UCard class="h-fit space-y-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        ملخص الطلب
      </h2>
      <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
        <span>الإجمالي</span>
        <span>{{ formatPrice(subtotal) }}</span>
      </div>
      <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
        <span>الشحن</span>
        <span>{{ formatPrice(shipping) }}</span>
      </div>
      <UDivider />
      <div class="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100">
        <span>الإجمالي الكلي</span>
        <span class="text-primary">{{ formatPrice(total) }}</span>
      </div>
      <UButton
        block
        color="primary"
        to="/checkout"
        :disabled="!hasItems"
        size="lg"
      >
        المتابعة للدفع
      </UButton>
      <UButton block variant="ghost" to="/products">
        متابعة التسوق
      </UButton>
    </UCard>
  </UContainer>
</template>
