<script setup lang="ts">
import type { Period, Range, Stat } from '~/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

interface AnalyticsOverviewData {
  orders: {
    value: number
    variation: number
  }
  customers: {
    value: number
    variation: number
  }
  products: {
    available: number
    total: number
  }
}

const { data: stats } = await useAsyncData<Stat[]>('home-stats', async () => {
  const data = await $fetch<AnalyticsOverviewData>('/api/analytics/overview', {
    query: {
      start: props.range.start.toISOString(),
      end: props.range.end.toISOString()
    },
    headers: useRequestHeaders(['cookie'])
  })

  return [
    {
      title: 'Orders',
      icon: 'i-lucide-shopping-cart',
      value: data.orders.value,
      variation: data.orders.variation,
      link: '/orders'
    },

    {
      title: 'Products',
      icon: 'i-lucide-box',
      value: `${data.products.available} / ${data.products.total}`,
      variation: 0, // No variation for now
      link: '/products',
      label: 'Available / Total'
    }
  ]
}, {
  watch: [() => props.range],
  default: () => []
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.link"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>
        <UBadge
          v-if="stat.title !== 'Products'"
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ Math.round(stat.variation) }}%
        </UBadge>
        <span v-else class="text-xs text-muted">
          {{ stat.label }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
