<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type ProductReview = {
  id: number
  productId: number
  orderId: number | null
  rating: number
  title: string | null
  content: string | null
  customerName: string | null
  isVerified: boolean
  status: ReviewStatus
  adminNote: string | null
  createdAt: string
  productName: string
  productImage: string | null
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

const statusFilter = computed({
  get: () => (route.query.status as ReviewStatus) || undefined,
  set: (val) => {
    router.push({ query: { ...route.query, status: val, page: 1 } })
  }
})

const { data, refresh, status: fetchStatus } = await useFetch('/api/reviews', {
  query: computed(() => ({
    page: page.value,
    limit: 20,
    status: statusFilter.value
  }))
})

const reviews = computed(() => (data.value?.reviews ?? []) as ProductReview[])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => data.value?.totalPages ?? 1)

const statusColors: Record<ReviewStatus, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
}

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

const columns: TableColumn<ProductReview>[] = [
  {
    accessorKey: 'productName',
    header: 'Product',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
      row.original.productImage
        ? h('img', { src: row.original.productImage, class: 'w-10 h-10 rounded object-cover', alt: row.original.productName })
        : h('div', { class: 'w-10 h-10 rounded bg-gray-100 flex items-center justify-center' }, [
            h(UIcon, { name: 'i-lucide-box', class: 'text-gray-400' })
          ]),
      h('span', { class: 'font-medium' }, row.original.productName)
    ])
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => h('span', { class: 'text-yellow-500 text-lg' }, renderStars(row.original.rating))
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h('span', {}, row.original.customerName || 'Anonymous'),
      row.original.isVerified ? h(UBadge, { color: 'success', size: 'xs' }, () => 'Verified') : null
    ])
  },
  {
    accessorKey: 'content',
    header: 'Review',
    cell: ({ row }) => h('div', { class: 'max-w-xs' }, [
      row.original.title ? h('p', { class: 'font-medium truncate' }, row.original.title) : null,
      h('p', { class: 'text-sm text-gray-500 truncate' }, row.original.content || 'No content')
    ])
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(UBadge, { color: statusColors[row.original.status] }, () => row.original.status)
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.createdAt)
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UButton, {
        icon: 'i-lucide-eye',
        size: 'xs',
        variant: 'ghost',
        onClick: () => openReview(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-trash-2',
        size: 'xs',
        variant: 'ghost',
        color: 'error',
        onClick: () => deleteReview(row.original)
      })
    ])
  }
]

const statusOptions = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' }
]

// Modal state
const selectedReview = ref<ProductReview | null>(null)
const isModalOpen = ref(false)
const modalNote = ref('')
const saving = ref(false)

function openReview(review: ProductReview) {
  selectedReview.value = review
  modalNote.value = review.adminNote ?? ''
  isModalOpen.value = true
}

async function updateStatus(review: ProductReview, newStatus: ReviewStatus) {
  saving.value = true
  try {
    await $fetch(`/api/reviews/${review.id}`, {
      method: 'PATCH',
      body: {
        status: newStatus,
        adminNote: modalNote.value || null
      }
    })
    toast.add({
      title: 'Review updated',
      description: `Review has been ${newStatus.toLowerCase()}.`,
      color: 'success'
    })
    isModalOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update review'
    toast.add({ title: 'Error', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function deleteReview(review: ProductReview) {
  if (!confirm('Are you sure you want to delete this review?')) return

  try {
    await $fetch(`/api/reviews/${review.id}`, { method: 'DELETE' })
    toast.add({ title: 'Review deleted', color: 'success' })
    await refresh()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete review'
    toast.add({ title: 'Error', description: message, color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="reviews">
    <template #header>
      <UDashboardNavbar title="Product Reviews">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="Filter by status"
            class="w-40"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4">
        <USkeleton v-if="fetchStatus === 'pending'" class="h-96 w-full" />

        <UTable
          v-else
          :data="reviews"
          :columns="columns"
          class="w-full"
        />

        <div v-if="totalPages > 1" class="flex justify-center mt-6">
          <UPagination v-model="page" :total="total" :items-per-page="20" />
        </div>
      </div>
    </template>

    <!-- Review Detail Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div v-if="selectedReview" class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Review Details
            </h3>
            <UBadge :color="statusColors[selectedReview.status]">
              {{ selectedReview.status }}
            </UBadge>
          </div>

          <div class="flex items-center gap-4">
            <img
              v-if="selectedReview.productImage"
              :src="selectedReview.productImage"
              class="w-16 h-16 rounded object-cover"
              :alt="selectedReview.productName"
            >
            <div>
              <p class="font-medium">
                {{ selectedReview.productName }}
              </p>
              <p class="text-yellow-500 text-xl">
                {{ renderStars(selectedReview.rating) }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">Customer:</span>
              <span>{{ selectedReview.customerName || 'Anonymous' }}</span>
              <UBadge v-if="selectedReview.isVerified" color="success" size="xs">
                Verified Purchase
              </UBadge>
            </div>
            <div v-if="selectedReview.orderId">
              <span class="text-sm text-gray-500">Order ID:</span>
              <NuxtLink
                :to="`/admin/orders/${selectedReview.orderId}`"
                class="text-blue-600 hover:underline ml-1"
              >
                #{{ selectedReview.orderId }}
              </NuxtLink>
            </div>
          </div>

          <div v-if="selectedReview.title" class="border-t pt-4">
            <p class="font-semibold">
              {{ selectedReview.title }}
            </p>
          </div>

          <div v-if="selectedReview.content" class="bg-gray-50 p-4 rounded-lg">
            <p class="whitespace-pre-wrap">
              {{ selectedReview.content }}
            </p>
          </div>

          <UFormField label="Admin Note (Internal)" name="adminNote">
            <UTextarea
              v-model="modalNote"
              placeholder="Add internal notes about this review..."
              :rows="2"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <UButton
              v-if="selectedReview.status !== 'REJECTED'"
              color="error"
              variant="outline"
              :loading="saving"
              @click="updateStatus(selectedReview, 'REJECTED')"
            >
              Reject
            </UButton>
            <UButton
              v-if="selectedReview.status !== 'APPROVED'"
              color="success"
              :loading="saving"
              @click="updateStatus(selectedReview, 'APPROVED')"
            >
              Approve
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
