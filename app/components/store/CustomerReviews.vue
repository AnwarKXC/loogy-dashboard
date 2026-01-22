<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  reviews: Array<{ name: string, title: string, body: string, rating?: number }>
}>()

const carouselItems = computed(() => props.reviews.map(review => ({
  ...review,
  class: 'basis-full md:basis-1/2 lg:basis-1/3 px-3'
})))

const carouselRef = ref()
</script>

<template>
  <section class="space-y-8 relative group" dir="rtl">
    <div class="flex items-center justify-between px-2">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Customer Reviews
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          What our customers say about us
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="carouselRef?.prev()"
        >
          <UIcon name="i-lucide-arrow-right" class="size-5" />
        </button>
        <button
          class="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="carouselRef?.next()"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </button>
      </div>
    </div>

    <UCarousel
      ref="carouselRef"
      v-slot="{ item }"
      :items="carouselItems"
      :autoplay="{ delay: 5000 }"
      :ui="{ container: 'ml-[-12px] py-4' }"
    >
      <UCard
        :key="item.name"
        class="h-full bg-white dark:bg-gray-800 border-none shadow-sm hover:shadow-md transition-shadow ring-1 ring-gray-200 dark:ring-gray-700"
      >
        <div class="flex flex-col gap-4 h-full">
          <div class="flex items-center gap-1 text-amber-400">
            <UIcon
              v-for="n in 5"
              :key="n"
              name="i-lucide-star"
              class="size-4 fill-current"
              :class="{ 'opacity-30': n > (item.rating || 5) }"
            />
          </div>

          <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-sm flex-1">
            "{{ item.body }}"
          </p>

          <div class="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {{ item.name.charAt(0) }}
            </div>
            <div>
              <p class="font-bold text-gray-900 dark:text-white text-sm">
                {{ item.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ item.title }}
              </p>
            </div>
            <UIcon name="i-lucide-quote" class="mr-auto text-gray-200 dark:text-gray-700 size-8" />
          </div>
        </div>
      </UCard>
    </UCarousel>
  </section>
</template>
