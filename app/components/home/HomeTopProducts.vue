<script setup lang="ts">
import type { Period, Range } from '~/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

const { data: products } = await useAsyncData('top-products', async () => {
  const days = Math.ceil((props.range.end.getTime() - props.range.start.getTime()) / (1000 * 60 * 60 * 24)) || 30

  return await $fetch<any[]>('/api/analytics/top-products', {
    query: {
      days,
      limit: 5
    },
    headers: useRequestHeaders(['cookie'])
  })
}, {
  watch: [() => props.range]
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}
</script>

<template>
  <UCard :ui="{ body: { padding: 'p-0' } }">
    <template #header>
      <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
        Top Products
      </h3>
    </template>

    <div v-if="products?.length" class="divide-y divide-gray-200 dark:divide-gray-800">
      <div
        v-for="(product, index) in products"
        :key="product.productId"
        class="flex items-center gap-4 p-4"
      >
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-500">
          {{ index + 1 }}
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ product.productName }}
          </p>
          <p class="text-xs text-gray-500">
            {{ product.totalQuantity }} sold
          </p>
        </div>

        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatCurrency(product.totalRevenue) }}
        </div>
      </div>
    </div>

    <div v-else class="p-8 text-center text-gray-500">
      <p class="text-sm">
        No sales data available
      </p>
    </div>
  </UCard>
</template>
