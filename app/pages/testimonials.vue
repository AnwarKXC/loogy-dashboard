<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

type Testimonial = {
  id: number
  customerName: string | null
  content: string | null
  images: string[]
  source: string | null
  rating: number | null
  createdAt: string
}

const page = ref(1)
const sourceFilter = ref<string | undefined>(undefined)

const { data, status } = await useFetch('/api/public/testimonials', {
  query: computed(() => ({
    page: page.value,
    limit: 12,
    source: sourceFilter.value
  }))
})

const testimonials = computed(() => (data.value?.testimonials ?? []) as Testimonial[])
const totalPages = computed(() => data.value?.totalPages ?? 1)

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

const sourceOptions = [
  { label: 'الكل', value: undefined },
  { label: 'فيسبوك', value: 'facebook' },
  { label: 'واتساب', value: 'whatsapp' },
  { label: 'انستجرام', value: 'instagram' },
  { label: 'جوجل', value: 'google' }
]

// Image modal
const selectedImage = ref<string | null>(null)
const isImageModalOpen = ref(false)

function openImage(img: string) {
  selectedImage.value = img
  isImageModalOpen.value = true
}
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <main class="flex-grow pt-20 pb-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl lg:text-5xl font-serif font-black uppercase text-center mb-4">
          آراء عملائنا
        </h1>
        <p class="text-center text-neutral-500 mb-8 max-w-2xl mx-auto">
          اطلع على تجارب عملائنا الحقيقية من مختلف منصات التواصل الاجتماعي
        </p>

        <!-- Filter -->
        <div class="flex justify-center mb-8">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in sourceOptions"
              :key="option.value ?? 'all'"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              :class="sourceFilter === option.value
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-300 hover:border-neutral-400'"
              @click="sourceFilter = option.value; page = 1"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div v-if="status === 'pending'" class="text-center py-16">
          <p class="text-neutral-500">
            جاري التحميل...
          </p>
        </div>

        <div v-else-if="testimonials.length === 0" class="text-center py-16">
          <p class="text-neutral-500">
            لا توجد تقييمات حتى الآن
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="testimonial in testimonials"
            :key="testimonial.id"
            class="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Header with source icon -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                  <UIcon
                    v-if="testimonial.source && sourceIcons[testimonial.source]"
                    :name="sourceIcons[testimonial.source]"
                    class="w-6 h-6"
                  />
                  <UIcon v-else name="i-lucide-user" class="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <p class="font-semibold">
                    {{ testimonial.customerName || 'عميل' }}
                  </p>
                  <p v-if="testimonial.source" class="text-xs text-neutral-500 capitalize">
                    {{ testimonial.source }}
                  </p>
                </div>
              </div>
              <div v-if="testimonial.rating" class="text-yellow-500 text-lg">
                {{ renderStars(testimonial.rating) }}
              </div>
            </div>

            <!-- Text Content -->
            <p v-if="testimonial.content" class="text-neutral-600 mb-4">
              {{ testimonial.content }}
            </p>

            <!-- Images (Screenshots) -->
            <div v-if="testimonial.images.length > 0" class="grid grid-cols-2 gap-2">
              <img
                v-for="(img, i) in testimonial.images"
                :key="i"
                :src="img"
                :alt="`Screenshot ${i + 1}`"
                class="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                @click="openImage(img)"
              >
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center mt-12 gap-2">
          <button
            :disabled="page <= 1"
            class="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
            @click="page--"
          >
            السابق
          </button>
          <span class="px-4 py-2 text-neutral-600">
            صفحة {{ page }} من {{ totalPages }}
          </span>
          <button
            :disabled="page >= totalPages"
            class="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
            @click="page++"
          >
            التالي
          </button>
        </div>
      </div>
    </main>

    <!-- Image Modal -->
    <UModal v-model:open="isImageModalOpen">
      <template #content>
        <div class="p-2 bg-black">
          <img
            v-if="selectedImage"
            :src="selectedImage"
            alt="Screenshot"
            class="max-w-full max-h-[85vh] mx-auto"
          >
        </div>
      </template>
    </UModal>
  </div>
</template>
