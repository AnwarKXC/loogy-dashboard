<script setup lang="ts">
const props = defineProps<{
  productId: number
}>()

type Review = {
  id: number
  rating: number
  title: string | null
  content: string | null
  customerName: string | null
  isVerified: boolean
  createdAt: string
}

type ReviewStats = {
  averageRating: number
  totalReviews: number
  distribution: Record<number, number>
}

const page = ref(1)

const { data, status } = await useFetch('/api/public/reviews/product', {
  query: computed(() => ({
    productId: props.productId,
    page: page.value,
    limit: 5
  }))
})

const reviews = computed(() => (data.value?.reviews ?? []) as Review[])
const stats = computed(() => (data.value?.stats ?? {
  averageRating: 0,
  totalReviews: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
}) as ReviewStats)
const totalPages = computed(() => data.value?.totalPages ?? 1)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function renderStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

// Calculate distribution percentages
const distributionPercent = computed(() => {
  const total = stats.value.totalReviews || 1
  return {
    5: Math.round((stats.value.distribution[5] / total) * 100),
    4: Math.round((stats.value.distribution[4] / total) * 100),
    3: Math.round((stats.value.distribution[3] / total) * 100),
    2: Math.round((stats.value.distribution[2] / total) * 100),
    1: Math.round((stats.value.distribution[1] / total) * 100)
  }
})

const loadMore = () => {
  if (page.value < totalPages.value) {
    page.value++
  }
}
</script>

<template>
  <div class="py-8">
    <h3 class="text-2xl font-serif font-black uppercase mb-8 text-center">
      تقييمات العملاء
    </h3>

    <div v-if="status === 'pending'" class="text-center py-8 text-neutral-500">
      جاري التحميل...
    </div>

    <div v-else-if="stats.totalReviews === 0" class="text-center py-8 text-neutral-500">
      <p>لا توجد تقييمات حتى الآن</p>
      <p class="text-sm mt-2">
        كن أول من يقيم هذا المنتج
      </p>
    </div>

    <div v-else class="space-y-8">
      <!-- Rating Summary -->
      <div class="flex flex-col md:flex-row gap-8 items-center justify-center bg-neutral-100 p-6 rounded-lg">
        <!-- Average Score -->
        <div class="text-center">
          <div class="text-5xl font-bold">
            {{ stats.averageRating.toFixed(1) }}
          </div>
          <div class="text-yellow-500 text-2xl">
            {{ renderStars(Math.round(stats.averageRating)) }}
          </div>
          <div class="text-sm text-neutral-500 mt-1">
            {{ stats.totalReviews }} تقييم
          </div>
        </div>

        <!-- Distribution Bars -->
        <div class="flex-1 max-w-md space-y-2">
          <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
            <span class="w-8 text-sm text-neutral-600">{{ star }} ★</span>
            <div class="flex-1 h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-yellow-500 transition-all duration-300"
                :style="{ width: `${distributionPercent[star as keyof typeof distributionPercent]}%` }"
              />
            </div>
            <span class="w-10 text-xs text-neutral-500 text-right">
              {{ stats.distribution[star] }}
            </span>
          </div>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="space-y-6">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="border-b border-neutral-200 pb-6"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ review.customerName || 'عميل' }}</span>
              <span
                v-if="review.isVerified"
                class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
              >
                عملية شراء موثقة
              </span>
            </div>
            <span class="text-sm text-neutral-500">{{ formatDate(review.createdAt) }}</span>
          </div>

          <div class="text-yellow-500 mb-2">
            {{ renderStars(review.rating) }}
          </div>

          <h4 v-if="review.title" class="font-semibold mb-1">
            {{ review.title }}
          </h4>

          <p v-if="review.content" class="text-neutral-600">
            {{ review.content }}
          </p>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="page < totalPages" class="text-center">
        <button
          class="px-6 py-2 border border-neutral-300 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
          @click="loadMore"
        >
          تحميل المزيد
        </button>
      </div>
    </div>
  </div>
</template>
