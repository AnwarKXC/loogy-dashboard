<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

type Testimonial = {
  id: number
  customerName: string | null
  content: string | null
  images: string[]
  source: string | null
  rating: number | null
  isPublished: boolean
  displayOrder: number
  createdAt: string
}

type TestimonialsResponse = {
  testimonials: Testimonial[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const toast = useToast()
const route = useRoute()
const router = useRouter()

const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (val) => {
    router.push({ query: { ...route.query, page: val } })
  }
})

const sourceFilter = computed({
  get: () => route.query.source as string | undefined,
  set: (val) => {
    router.push({ query: { ...route.query, source: val, page: 1 } })
  }
})

const { data, refresh, status: fetchStatus } = await useFetch<TestimonialsResponse>('/api/testimonials', {
  query: computed(() => ({
    page: page.value,
    limit: 20,
    source: sourceFilter.value
  }))
})

const testimonials = computed(() => data.value?.testimonials ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => data.value?.totalPages ?? 1)

const sourceOptions = [
  { label: 'All', value: undefined },
  { label: 'Facebook', value: 'facebook' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Google', value: 'google' },
  { label: 'Other', value: 'other' }
]

const sourceLabels: Record<string, string> = {
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  google: 'Google',
  other: 'Other'
}

function renderStars(rating: number | null): string {
  if (!rating) return '-'
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

const columns: TableColumn<Testimonial>[] = [
  {
    accessorKey: 'images',
    header: 'Images',
    cell: ({ row }) => {
      const imgs = row.original.images.slice(0, 3)
      if (imgs.length === 0) {
        return h('span', { class: 'text-gray-400 text-sm' }, 'No images')
      }
      const children = imgs.map((img, i) =>
        h('img', { key: i, src: img, class: 'w-10 h-10 rounded border-2 border-white object-cover', alt: `Image ${i + 1}` })
      )
      if (row.original.images.length > 3) {
        children.push(h('span', { class: 'w-10 h-10 rounded bg-gray-100 border-2 border-white flex items-center justify-center text-xs' }, `+${row.original.images.length - 3}`))
      }
      return h('div', { class: 'flex -space-x-2' }, children)
    }
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => row.original.customerName || 'Anonymous'
  },
  {
    accessorKey: 'content',
    header: 'Content',
    cell: ({ row }) => h('p', { class: 'max-w-xs truncate text-sm text-gray-600' }, row.original.content || 'No text content')
  },
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }) => row.original.source
      ? h(UBadge, { color: 'info', variant: 'subtle' }, () => sourceLabels[row.original.source!] || row.original.source)
      : h('span', { class: 'text-gray-400' }, '-')
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => h('span', { class: 'text-yellow-500' }, renderStars(row.original.rating))
  },
  {
    accessorKey: 'isPublished',
    header: 'Status',
    cell: ({ row }) => h(UBadge, { color: row.original.isPublished ? 'success' : 'neutral' }, () => row.original.isPublished ? 'Published' : 'Draft')
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UButton, {
        icon: row.original.isPublished ? 'i-lucide-eye-off' : 'i-lucide-eye',
        size: 'xs',
        variant: 'ghost',
        title: row.original.isPublished ? 'Unpublish' : 'Publish',
        onClick: () => togglePublished(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-edit',
        size: 'xs',
        variant: 'ghost',
        onClick: () => openEdit(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-trash-2',
        size: 'xs',
        variant: 'ghost',
        color: 'error',
        onClick: () => deleteTestimonial(row.original)
      })
    ])
  }
]

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const schema = z.object({
  customerName: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).default([]),
  source: z.string().max(50).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  isPublished: z.boolean().default(false),
  displayOrder: z.number().default(0)
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  customerName: '',
  content: '',
  images: [],
  source: 'facebook',
  rating: null,
  isPublished: false,
  displayOrder: 0
})

const imageInput = ref('')

function resetState() {
  state.customerName = ''
  state.content = ''
  state.images = []
  state.source = 'facebook'
  state.rating = null
  state.isPublished = false
  state.displayOrder = 0
  imageInput.value = ''
}

function openCreate() {
  isEditing.value = false
  editingId.value = null
  resetState()
  isModalOpen.value = true
}

function openEdit(testimonial: Testimonial) {
  isEditing.value = true
  editingId.value = testimonial.id
  state.customerName = testimonial.customerName ?? ''
  state.content = testimonial.content ?? ''
  state.images = testimonial.images
  state.source = testimonial.source ?? 'facebook'
  state.rating = testimonial.rating
  state.isPublished = testimonial.isPublished
  state.displayOrder = testimonial.displayOrder
  isModalOpen.value = true
}

function addImage() {
  if (imageInput.value && imageInput.value.startsWith('http')) {
    state.images.push(imageInput.value)
    imageInput.value = ''
  }
}

function removeImage(index: number) {
  state.images.splice(index, 1)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const submitData = {
      ...event.data,
      customerName: event.data.customerName || null,
      content: event.data.content || null,
      source: event.data.source || null
    }

    if (isEditing.value && editingId.value) {
      await $fetch(`/api/testimonials/${editingId.value}`, {
        method: 'PATCH',
        body: submitData
      })
      toast.add({
        title: 'Testimonial updated',
        color: 'success'
      })
    } else {
      await $fetch('/api/testimonials', {
        method: 'POST',
        body: submitData
      })
      toast.add({
        title: 'Testimonial created',
        color: 'success'
      })
    }
    isModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save testimonial'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function togglePublished(testimonial: Testimonial) {
  try {
    await $fetch(`/api/testimonials/${testimonial.id}`, {
      method: 'PATCH',
      body: { isPublished: !testimonial.isPublished }
    })
    toast.add({
      title: testimonial.isPublished ? 'Testimonial unpublished' : 'Testimonial published',
      color: 'success'
    })
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}

async function deleteTestimonial(testimonial: Testimonial) {
  if (!confirm('Are you sure you want to delete this testimonial?')) return

  try {
    await $fetch(`/api/testimonials/${testimonial.id}`, {
      method: 'DELETE'
    })
    toast.add({
      title: 'Testimonial deleted',
      color: 'success'
    })
    await refresh()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete'
    toast.add({ title: 'Error', description: message, color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="testimonials" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Testimonials" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full ">
        <div class="flex items-center justify-end gap-4 -mt-6">
          <USelect
            v-model="sourceFilter"
            :items="sourceOptions"
            placeholder="Filter by source"
            class="w-40"
          />
          <UButton
            icon="i-lucide-plus"
            label="Add Testimonial"
            @click="openCreate"
          />
        </div>
        <div class="p-4">
          <USkeleton v-if="fetchStatus === 'pending'" class="h-96 w-full" />

          <div v-else-if="testimonials.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-message-square-quote" class="text-4xl text-gray-400 mb-2" />
            <p class="text-gray-500">
              No testimonials found
            </p>
            <UButton class="mt-4" @click="openCreate">
              Add your first testimonial
            </UButton>
          </div>

          <UTable
            v-else
            :data="testimonials"
            :columns="columns"
            class="w-full"
          />

          <div v-if="totalPages > 1" class="flex justify-center mt-6">
            <UPagination v-model="page" :total="total" :items-per-page="20" />
          </div>
        </div>

        <!-- Create/Edit Modal -->
        <UModal
          v-model:open="isModalOpen"
          :title="isEditing ? 'Edit Testimonial' : 'Add Testimonial'"
        >
          <template #body>
            <UForm
              :schema="schema"
              :state="state"
              class="space-y-4"
              @submit="onSubmit"
            >
              <UFormField label="Customer Name" name="customerName">
                <UInput
                  v-model="state.customerName"
                  placeholder="Customer name (optional)"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Source" name="source">
                <USelect
                  v-model="state.source"
                  :items="sourceOptions.filter(s => s.value)"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Rating" name="rating">
                <div class="flex gap-2">
                  <UButton
                    v-for="star in 5"
                    :key="star"
                    :color="state.rating && state.rating >= star ? 'warning' : 'neutral'"
                    :variant="state.rating && state.rating >= star ? 'solid' : 'outline'"

                    @click="state.rating = star"
                  >
                    ★
                  </UButton>
                  <UButton
                    v-if="state.rating"

                    variant="ghost"
                    @click="state.rating = null"
                  >
                    Clear
                  </UButton>
                </div>
              </UFormField>

              <UFormField label="Text Content" name="content">
                <UTextarea
                  v-model="state.content"
                  placeholder="Testimonial text (optional if you have images)"
                  :rows="3"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Images" name="images">
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <UInput
                      v-model="imageInput"
                      placeholder="Enter image URL"
                      class="flex-1"
                      @keyup.enter="addImage"
                    />
                    <UButton
                      icon="i-lucide-plus"
                      @click="addImage"
                    />
                  </div>
                  <div v-if="state.images.length > 0" class="flex flex-wrap gap-2 mt-2">
                    <div
                      v-for="(img, i) in state.images"
                      :key="i"
                      class="relative"
                    >
                      <img
                        :src="img"
                        class="w-20 h-20 object-cover rounded"
                        :alt="`Image ${i + 1}`"
                      >
                      <button
                        type="button"
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        @click="removeImage(i)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </UFormField>

              <UFormField label="Display Order" name="displayOrder">
                <UInput
                  v-model.number="state.displayOrder"
                  type="number"
                  class="w-full"
                />
                <template #help>
                  Lower numbers appear first
                </template>
              </UFormField>

              <UFormField name="isPublished">
                <UCheckbox
                  v-model="state.isPublished"
                  label="Published (visible on storefront)"
                />
              </UFormField>
            </UForm>
          </template>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                variant="outline"
                @click="isModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                :loading="saving"
                @click="onSubmit({ data: state } as FormSubmitEvent<Schema>)"
              >
                {{ isEditing ? 'Save Changes' : 'Create' }}
              </UButton>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
