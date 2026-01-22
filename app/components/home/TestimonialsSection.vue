<script setup lang="ts">
type Testimonial = {
  id: number
  customerName: string | null
  content: string | null
  images: string[]
  source: string | null
  rating: number | null
  createdAt: string
}

const { data, status } = await useFetch('/api/public/testimonials', {
  query: { limit: 6 }
})

const testimonials = computed(() => (data.value?.testimonials ?? []) as Testimonial[])

function renderStars(rating: number | null): string {
  if (!rating) return ''
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

const sourceIcons: Record<string, string> = {
  facebook: 'i-simple-icons-facebook',
  whatsapp: 'i-simple-icons-whatsapp',
  instagram: 'i-simple-icons-instagram',
  google: 'i-simple-icons-google'
}

// Image modal
const selectedImage = ref<string | null>(null)
const isImageModalOpen = ref(false)

function openImage(img: string) {
  selectedImage.value = img
  isImageModalOpen.value = true
}
</script>

<template>
  <section class="py-16 bg-white">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-serif font-black uppercase text-center mb-4">
        Customer Reviews
      </h2>
      <p class="text-center text-neutral-500 mb-12">
        What our customers say about their experience with us
      </p>

      <div v-if="status === 'pending'" class="text-center py-8">
        Loading...
      </div>

      <div v-else-if="testimonials.length === 0" class="text-center py-8 text-neutral-500">
        No reviews yet
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="testimonial in testimonials"
          :key="testimonial.id"
          class="bg-neutral-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <!-- Header with source icon -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                <UIcon
                  v-if="testimonial.source && sourceIcons[testimonial.source]"
                  :name="sourceIcons[testimonial.source]"
                  class="w-5 h-5"
                />
                <UIcon v-else name="i-lucide-user" class="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p class="font-medium">
                  {{ testimonial.customerName || 'Customer' }}
                </p>
                <p v-if="testimonial.source" class="text-xs text-neutral-500">
                  {{ testimonial.source }}
                </p>
              </div>
            </div>
            <div v-if="testimonial.rating" class="text-yellow-500">
              {{ renderStars(testimonial.rating) }}
            </div>
          </div>

          <!-- Text Content -->
          <p v-if="testimonial.content" class="text-neutral-600 mb-4 line-clamp-3">
            {{ testimonial.content }}
          </p>

          <!-- Images (Screenshots) -->
          <div v-if="testimonial.images.length > 0" class="grid grid-cols-2 gap-2">
            <img
              v-for="(img, i) in testimonial.images.slice(0, 4)"
              :key="i"
              :src="img"
              :alt="`Screenshot ${i + 1}`"
              class="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
              @click="openImage(img)"
            >
          </div>
        </div>
      </div>

      <!-- View All Link -->
      <div v-if="testimonials.length > 0" class="text-center mt-8">
        <NuxtLink
          to="/testimonials"
          class="inline-block px-6 py-3 border border-neutral-300 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
        >
          View All Reviews
        </NuxtLink>
      </div>
    </div>

    <!-- Image Modal -->
    <UModal v-model:open="isImageModalOpen">
      <template #content>
        <div class="p-2">
          <img
            v-if="selectedImage"
            :src="selectedImage"
            alt="Screenshot"
            class="max-w-full max-h-[80vh] mx-auto"
          >
        </div>
      </template>
    </UModal>
  </section>
</template>
