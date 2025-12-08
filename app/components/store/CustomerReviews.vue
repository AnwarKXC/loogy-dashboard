<script setup lang="ts">
const props = defineProps<{
  reviews: Array<{ name: string, title: string, body: string, rating?: number }>
}>()
</script>

<template>
  <section id="reviews" class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        What customers say
      </h2>
      <ULink to="/reviews" class="text-primary font-medium">All reviews</ULink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <UCard
        v-for="review in props.reviews"
        :key="review.name"
        variant="soft"
        class="h-full"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="text-primary" />
          <div>
            <p class="font-semibold">
              {{ review.name }}
            </p>
            <p class="text-sm text-muted">
              {{ review.title }}
            </p>
          </div>
        </div>
        <p class="mt-3 text-sm leading-relaxed">
          “{{ review.body }}”
        </p>
        <div class="mt-2 flex items-center gap-1 text-amber-500">
          <UIcon
            v-for="n in 5"
            :key="n"
            name="i-lucide-star"
            :class="{ 'opacity-40': n > (review.rating || 5) }"
          />
        </div>
      </UCard>
    </div>
  </section>
</template>
