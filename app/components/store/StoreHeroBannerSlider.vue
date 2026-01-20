<script setup lang="ts">
import { computed } from 'vue'
import type { CarouselItem } from '@nuxt/ui'

const props = defineProps<{
  slides: Array<{ title: string, description: string, image: string, to?: string }>
}>()

const items = computed<CarouselItem[]>(() => props.slides.map(slide => ({
  ...slide,
  class: 'basis-full'
})))
</script>

<template>
  <section class="relative overflow-hidden group">
    <UCarousel
      v-slot="{ item }"
      :items="items"
      :ui="{
        item: 'min-w-0',
        container: 'rounded-none',
        indicators: {
          wrapper: 'absolute flex items-center justify-center gap-3 bottom-8 inset-x-0 z-10',
          base: 'rounded-full h-2 w-2 ring-1 ring-white/50 transition-all duration-300',
          active: 'bg-white w-6 ring-white',
          inactive: 'bg-white/40 hover:bg-white/70'
        }
      }"
      dots
      :autoplay="{ delay: 5000 }"
      class="rounded-none h-[500px] sm:h-[600px] lg:h-[700px]"
    >
      <div class="relative w-full h-full">
        <img
          :src="item.image"
          :alt="item.title"
          class="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        >
        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        <!-- Content -->
        <div class="absolute inset-0 flex items-center justify-start p-8 sm:p-16 lg:p-24">
          <div class="max-w-2xl space-y-6 text-white" dir="rtl">
            <div class="overflow-hidden">
              <p class="text-sm font-medium tracking-[0.2em] text-primary-400 uppercase animate-fade-in-up">
                موضة 2026
              </p>
            </div>

            <h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight drop-shadow-lg">
              {{ item.title }}
            </h1>

            <p class="text-lg sm:text-xl text-gray-200 max-w-lg leading-relaxed drop-shadow-md">
              {{ item.description }}
            </p>

            <div class="flex flex-wrap gap-4 pt-4">
              <UButton
                :to="item.to || '/products'"
                color="white"
                variant="solid"
                size="xl"
                class="px-8 font-bold text-gray-900 hover:bg-gray-100 transition-colors"
                trailing-icon="i-lucide-arrow-left"
              >
                تسوق المجموعة
              </UButton>
              <UButton
                to="#deals"
                color="white"
                variant="outline"
                size="xl"
                class="px-8 hover:bg-white/10 transition-colors"
              >
                اكتشف العروض
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCarousel>
  </section>
</template>
