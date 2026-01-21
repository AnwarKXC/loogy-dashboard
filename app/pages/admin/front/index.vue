<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const toast = useToast()

// Schema for hero slides
const slideSchema = z.object({
  image: z.string().optional(),
  image2: z.string().optional(),
  subtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaTo: z.string().optional()
})

// Schema for reviews
const reviewSchema = z.object({
  id: z.number(),
  user: z.string(),
  msg: z.string(),
  time: z.string(),
  avatar: z.string().optional(),
  platform: z.string().optional()
})

// Full schema
const storefrontSchema = z.object({
  hero: z.object({
    title: z.string().default('NEW COLLECTION'),
    subtitle: z.string().default('Shop the latest drops'),
    ctaLabel: z.string().default('GO TO SHOP'),
    ctaTo: z.string().default('/products'),
    slides: z.array(slideSchema).default([])
  }),
  sections: z.object({
    newArrivalProductIds: z.array(z.number()).default([]),
    collectionProductIds: z.array(z.number()).default([]),
    egyptProductIds: z.array(z.number()).default([]),
    previousOrderProductIds: z.array(z.number()).default([])
  }),
  galleryImages: z.array(z.string()).default([]),
  reviews: z.array(reviewSchema).default([])
})

type StorefrontData = z.infer<typeof storefrontSchema>

const defaultData: StorefrontData = {
  hero: {
    title: 'NEW COLLECTION',
    subtitle: 'Shop the latest drops',
    ctaLabel: 'GO TO SHOP',
    ctaTo: '/products',
    slides: []
  },
  sections: {
    newArrivalProductIds: [],
    collectionProductIds: [],
    egyptProductIds: [],
    previousOrderProductIds: []
  },
  galleryImages: [],
  reviews: []
}

const state = reactive<StorefrontData>({ ...defaultData })

// For comma-separated IDs input
const newArrivalIds = ref('')
const collectionIds = ref('')
const egyptIds = ref('')
const saleIds = ref('')
const galleryImagesText = ref('')

const saving = ref(false)

const { data, pending, refresh } = await useFetch('/api/superadmin/storefront/home')

// Helpers for single image <-> array conversion
function toImageArray(value: string | undefined): string[] {
  return value ? [value] : []
}

function fromImageArray(arr: string[]): string | undefined {
  return arr[0] ?? undefined
}

function parseIds(str: string): number[] {
  return str
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n > 0)
}

function idsToString(ids: number[]): string {
  return ids.join(', ')
}

watch(
  () => data.value,
  (value) => {
    try {
      const raw = value?.content?.data ?? {}
      const parsed = storefrontSchema.parse(raw)
      Object.assign(state, parsed)
      newArrivalIds.value = idsToString(parsed.sections.newArrivalProductIds)
      collectionIds.value = idsToString(parsed.sections.collectionProductIds)
      egyptIds.value = idsToString(parsed.sections.egyptProductIds)
      saleIds.value = idsToString(parsed.sections.previousOrderProductIds)
      galleryImagesText.value = parsed.galleryImages.join('\n')
    } catch {
      Object.assign(state, defaultData)
    }
  },
  { immediate: true }
)

function resolveErrorMessage(error: unknown) {
  if (error instanceof FetchError) {
    return error.data?.statusMessage || error.data?.message || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong'
}

async function handleSave(event: FormSubmitEvent<StorefrontData>) {
  saving.value = true

  try {
    // Update sections from text inputs
    const payload: StorefrontData = {
      ...event.data,
      sections: {
        newArrivalProductIds: parseIds(newArrivalIds.value),
        collectionProductIds: parseIds(collectionIds.value),
        egyptProductIds: parseIds(egyptIds.value),
        previousOrderProductIds: parseIds(saleIds.value)
      },
      galleryImages: galleryImagesText.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }

    // Validate before sending
    const validated = storefrontSchema.parse(payload)

    await $fetch('/api/superadmin/storefront/home', {
      method: 'PATCH',
      body: { data: validated }
    })

    toast.add({
      title: 'Storefront updated',
      color: 'success'
    })

    await refresh()
  } catch (error) {
    toast.add({
      title: 'Update failed',
      description: resolveErrorMessage(error),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Slides management
function addSlide() {
  state.hero.slides.push({
    image: '',
    image2: '',
    subtitle: '',
    ctaLabel: '',
    ctaTo: ''
  })
}

function removeSlide(index: number) {
  state.hero.slides.splice(index, 1)
}

// Reviews management
function addReview() {
  const nextId = state.reviews.length > 0 ? Math.max(...state.reviews.map(r => r.id)) + 1 : 1
  state.reviews.push({
    id: nextId,
    user: '',
    msg: '',
    time: '',
    avatar: '',
    platform: 'Facebook'
  })
}

function removeReview(index: number) {
  state.reviews.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Storefront Home"
      description="Configure the home page content, hero section, product carousels, and reviews."
      variant="subtle"
    >
      <UAlert
        v-if="pending"
        color="neutral"
        icon="i-lucide-loader"
        title="Loading storefront content..."
        class="mb-4"
      />

      <UForm
        :state="state"
        :schema="storefrontSchema"
        class="space-y-8"
        @submit="handleSave"
      >
        <!-- Hero Section -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Hero Section
          </legend>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <UFormField label="Title" name="hero.title">
              <UInput v-model="state.hero.title" placeholder="NEW COLLECTION" />
            </UFormField>

            <UFormField label="Subtitle" name="hero.subtitle">
              <UInput v-model="state.hero.subtitle" placeholder="Shop the latest drops" />
            </UFormField>

            <UFormField label="CTA Button Label" name="hero.ctaLabel">
              <UInput v-model="state.hero.ctaLabel" placeholder="GO TO SHOP" />
            </UFormField>

            <UFormField label="CTA Button Link" name="hero.ctaTo">
              <UInput v-model="state.hero.ctaTo" placeholder="/products" />
            </UFormField>
          </div>

          <!-- Hero Slides -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium">Hero Slides</span>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                @click="addSlide"
              >
                Add Slide
              </UButton>
            </div>

            <div v-if="state.hero.slides.length === 0" class="text-sm text-neutral-500 italic">
              No slides configured. Default hero images will be used.
            </div>

            <div v-for="(slide, idx) in state.hero.slides" :key="idx" class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-3">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold text-neutral-500">Slide {{ idx + 1 }}</span>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="removeSlide(idx)"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UFormField label="Main Image">
                  <MediaS3ImageUploader
                    :model-value="toImageArray(slide.image)"
                    single-mode
                    class="w-full"
                    @update:model-value="slide.image = fromImageArray($event)"
                  />
                  <UInput
                    v-model="slide.image"
                    placeholder="Or paste URL directly..."
                    class="mt-2"
                  />
                </UFormField>

                <UFormField label="Secondary Image">
                  <MediaS3ImageUploader
                    :model-value="toImageArray(slide.image2)"
                    single-mode
                    class="w-full"
                    @update:model-value="slide.image2 = fromImageArray($event)"
                  />
                  <UInput
                    v-model="slide.image2"
                    placeholder="Or paste URL directly..."
                    class="mt-2"
                  />
                </UFormField>

                <UFormField label="Subtitle (optional)">
                  <UInput v-model="slide.subtitle" placeholder="Seasonal drops" />
                </UFormField>

                <UFormField label="CTA Label (optional)">
                  <UInput v-model="slide.ctaLabel" placeholder="SHOP NOW" />
                </UFormField>

                <UFormField label="CTA Link (optional)" class="md:col-span-2">
                  <UInput v-model="slide.ctaTo" placeholder="/products/featured" />
                </UFormField>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Product Sections -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Product Sections (Product IDs)
          </legend>

          <div class="space-y-4 mt-4">
            <UFormField label="New Arrivals" hint="Comma-separated product IDs (e.g., 1, 2, 3)">
              <UInput v-model="newArrivalIds" placeholder="1, 2, 3, 4" />
            </UFormField>

            <UFormField label="Collections Featured" hint="Comma-separated product IDs for collection showcase">
              <UInput v-model="collectionIds" placeholder="5, 6, 7" />
            </UFormField>

            <UFormField label="Available In Egypt" hint="Comma-separated product IDs for Egypt section">
              <UInput v-model="egyptIds" placeholder="8, 9, 10" />
            </UFormField>

            <UFormField label="For Sale / Offers" hint="Comma-separated product IDs for sale section">
              <UInput v-model="saleIds" placeholder="11, 12, 13, 14, 15" />
            </UFormField>
          </div>
        </fieldset>

        <!-- Gallery Images -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Gallery Images
          </legend>

          <p class="text-sm text-neutral-500 mb-4">
            Upload images or paste URLs directly.
          </p>

          <MediaS3ImageUploader v-model="state.galleryImages" class="mb-4" />

          <UFormField label="Or paste URLs" hint="One URL per line (for images not uploaded above)">
            <UTextarea v-model="galleryImagesText" :rows="3" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
          </UFormField>
        </fieldset>

        <!-- Reviews -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Customer Reviews
          </legend>

          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-neutral-500">Displayed in the Facebook-style review section</span>
            <UButton
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              @click="addReview"
            >
              Add Review
            </UButton>
          </div>

          <div v-if="state.reviews.length === 0" class="text-sm text-neutral-500 italic">
            No reviews configured.
          </div>

          <div v-for="(review, idx) in state.reviews" :key="review.id" class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-3">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-neutral-500">Review #{{ review.id }}</span>
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="removeReview(idx)"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UFormField label="User Name">
                <UInput v-model="review.user" placeholder="John Doe" />
              </UFormField>

              <UFormField label="Time">
                <UInput v-model="review.time" placeholder="2 days ago" />
              </UFormField>

              <UFormField label="Avatar">
                <MediaS3ImageUploader
                  :model-value="toImageArray(review.avatar)"
                  single-mode
                  class="w-full"
                  @update:model-value="review.avatar = fromImageArray($event)"
                />
                <UInput
                  v-model="review.avatar"
                  placeholder="Or paste URL..."
                  class="mt-2"
                />
              </UFormField>

              <UFormField label="Platform">
                <UInput v-model="review.platform" placeholder="Facebook" />
              </UFormField>

              <UFormField label="Message" class="md:col-span-2">
                <UTextarea v-model="review.msg" :rows="2" placeholder="Great product, fast shipping!" />
              </UFormField>
            </div>
          </div>
        </fieldset>

        <!-- Submit -->
        <div class="flex justify-end pt-4">
          <UButton
            type="submit"
            color="primary"
            :loading="saving"
            icon="i-lucide-save"
          >
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
