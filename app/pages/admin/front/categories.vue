<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const toast = useToast()

// Define the schema
const categoryImageSchema = z.object({
  slug: z.string(),
  imageUrl: z.string()
})

const categoriesSchema = z.object({
  images: z.array(categoryImageSchema).default([]),
  featuredSlugs: z.array(z.string()).default([])
})

type CategoriesData = z.infer<typeof categoriesSchema>

const defaultData: CategoriesData = {
  images: [],
  featuredSlugs: []
}

const state = reactive<CategoriesData>(JSON.parse(JSON.stringify(defaultData)))
const saving = ref(false)

// Fetch categories for autocomplete
const { data: categoriesData } = await useFetch<{ categories: Array<{ id: number, name: string, slug: string }> }>('/api/categories')

const availableCategories = computed(() => {
  if (!categoriesData.value?.categories) return []
  return flattenCategories(categoriesData.value.categories)
})

// Category type with nested children
interface CategoryNode {
  id: number
  name: string
  slug: string
  children?: CategoryNode[]
}

// Helper to flatten nested category tree
function flattenCategories(categories: CategoryNode[], result: CategoryNode[] = []): CategoryNode[] {
  for (const cat of categories) {
    result.push({ id: cat.id, name: cat.name, slug: cat.slug })
    if (cat.children?.length) {
      flattenCategories(cat.children, result)
    }
  }
  return result
}

// Fetch current data
const { data, pending, refresh } = await useFetch('/api/superadmin/storefront/categories')

watch(
  () => data.value,
  (value) => {
    try {
      const raw = (value?.content?.data ?? {}) as Record<string, unknown>

      // Convert old format { images: { slug: url } } to new format { images: [{ slug, imageUrl }] }
      let images: Array<{ slug: string, imageUrl: string }> = []
      if (raw.images) {
        if (Array.isArray(raw.images)) {
          images = raw.images as Array<{ slug: string, imageUrl: string }>
        } else {
          // Convert object to array
          images = Object.entries(raw.images as Record<string, string>).map(([slug, imageUrl]) => ({
            slug,
            imageUrl
          }))
        }
      }

      const rawFeaturedSlugs = raw.featuredSlugs
      const featuredSlugs = Array.isArray(rawFeaturedSlugs) ? rawFeaturedSlugs as string[] : []

      state.images = images
      state.featuredSlugs = featuredSlugs
    } catch {
      Object.assign(state, JSON.parse(JSON.stringify(defaultData)))
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

async function handleSave(event: FormSubmitEvent<CategoriesData>) {
  saving.value = true

  try {
    // Convert back to object format for API compatibility
    const imagesObj: Record<string, string> = {}
    for (const img of event.data.images) {
      if (img.slug && img.imageUrl) {
        imagesObj[img.slug] = img.imageUrl
      }
    }

    const payload = {
      images: imagesObj,
      featuredSlugs: event.data.featuredSlugs.filter(s => s)
    }

    await $fetch('/api/superadmin/storefront/categories', {
      method: 'PATCH',
      body: { data: payload }
    })

    toast.add({
      title: 'Categories updated',
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

// Category Image management
function addCategoryImage() {
  state.images.push({ slug: '', imageUrl: '' })
}

function removeCategoryImage(index: number) {
  state.images.splice(index, 1)
}

// Featured Slugs management
const newFeaturedSlug = ref('')

function addFeaturedSlug() {
  if (newFeaturedSlug.value && !state.featuredSlugs.includes(newFeaturedSlug.value)) {
    state.featuredSlugs.push(newFeaturedSlug.value)
    newFeaturedSlug.value = ''
  }
}

function removeFeaturedSlug(index: number) {
  state.featuredSlugs.splice(index, 1)
}

// Slug select options
const slugOptions = computed(() =>
  availableCategories.value.map(c => ({
    label: `${c.name} (${c.slug})`,
    value: c.slug
  }))
)

// Helpers for S3ImageUploader (expects string[], single fields use string)
function toImageArray(value: string | undefined): string[] {
  return value ? [value] : []
}

function fromImageArray(arr: string[]): string | undefined {
  return arr[0] ?? undefined
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Storefront Categories"
      description="Configure category images and featured categories for the storefront."
      variant="subtle"
    >
      <UAlert
        v-if="pending"
        color="neutral"
        icon="i-lucide-loader"
        title="Loading category settings..."
        class="mb-4"
      />

      <UForm
        :state="state"
        :schema="categoriesSchema"
        class="space-y-8"
        @submit="handleSave"
      >
        <!-- Category Images -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Category Images
          </legend>
          <p class="text-sm text-neutral-500 mt-2 mb-4">
            Assign custom images to category slugs. These images will be displayed on the category cards.
          </p>

          <div class="flex items-center justify-end mb-4">
            <UButton
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              @click="addCategoryImage"
            >
              Add Image
            </UButton>
          </div>

          <div v-if="state.images.length === 0" class="text-sm text-neutral-500 italic text-center py-4">
            No category images configured. Click "Add Image" to start.
          </div>

          <div class="space-y-3">
            <div v-for="(img, idx) in state.images" :key="idx" class="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium">Category {{ idx + 1 }}</span>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="removeCategoryImage(idx)"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField :label="`Category Slug`">
                  <USelectMenu
                    v-model="img.slug"
                    :items="slugOptions"
                    value-key="value"
                    placeholder="Select category..."
                    searchable
                  />
                </UFormField>

                <UFormField :label="`Image`">
                  <MediaS3ImageUploader
                    :model-value="toImageArray(img.imageUrl)"
                    single-mode
                    class="w-full"
                    @update:model-value="img.imageUrl = fromImageArray($event) ?? ''"
                  />
                  <UInput
                    v-model="img.imageUrl"
                    placeholder="Or paste URL..."
                    class="mt-2"
                  />
                </UFormField>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Featured Category Slugs -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Featured Categories
          </legend>
          <p class="text-sm text-neutral-500 mt-2 mb-4">
            Select which categories should be prominently featured on the homepage or categories page.
          </p>

          <div class="flex items-center gap-3 mb-4">
            <USelectMenu
              v-model="newFeaturedSlug"
              :items="slugOptions"
              value-key="value"
              placeholder="Select category to feature..."
              searchable
              class="flex-1"
            />
            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              :disabled="!newFeaturedSlug"
              @click="addFeaturedSlug"
            >
              Add
            </UButton>
          </div>

          <div v-if="state.featuredSlugs.length === 0" class="text-sm text-neutral-500 italic text-center py-4">
            No featured categories selected.
          </div>

          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="(slug, idx) in state.featuredSlugs"
              :key="slug"
              color="primary"
              variant="subtle"
              class="text-sm"
            >
              {{ availableCategories.find(c => c.slug === slug)?.name || slug }}
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-x"
                class="ml-1 -mr-1"
                @click="removeFeaturedSlug(idx)"
              />
            </UBadge>
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
