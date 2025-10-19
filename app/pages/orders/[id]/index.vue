<script setup lang="ts">
import { format } from 'date-fns'
import { computed, reactive, ref, watch } from 'vue'

import type { OrderDetail, OrderDetailResponse } from '~/types'

type OrderUpdatePayload = Partial<Pick<OrderDetail,
  'status' | 'paymentMethod' | 'shippingPhone' | 'shippingWhatsapp' | 'shippingStreet' | 'shippingCity' | 'shippingCountry'
>>

const route = useRoute()
const toast = useToast()

const orderId = computed(() => Number(route.params.id))

if (!Number.isFinite(orderId.value) || orderId.value <= 0) {
  throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
}

const order = ref<OrderDetail | null>(null)

const {
  data: orderResponse,
  status,
  error,
  refresh
} = await useFetch<OrderDetailResponse>(`/api/orders/${orderId.value}`)

watch(orderId, () => {
  refresh()
})

watch(orderResponse, (value) => {
  order.value = value?.order ?? null
}, { immediate: true })

const shippingFields = reactive({
  phone: '',
  whatsapp: '',
  street: '',
  city: '',
  country: ''
})

watch(order, (value) => {
  shippingFields.phone = value?.shippingPhone ?? ''
  shippingFields.whatsapp = value?.shippingWhatsapp ?? ''
  shippingFields.street = value?.shippingStreet ?? ''
  shippingFields.city = value?.shippingCity ?? ''
  shippingFields.country = value?.shippingCountry ?? ''
}, { immediate: true })

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Shipping', value: 'SHIPPING' },
  { label: 'Delivered', value: 'DELIVERED' }
]

const paymentOptions = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Vodafone Cash', value: 'VODAFONE_CASH' },
  { label: 'Instapay', value: 'INSTAPAY' },
  { label: 'Visa', value: 'VISA' }
]

async function updateOrder(update: OrderUpdatePayload) {
  if (!order.value) {
    return
  }

  const bodyEntries = Object.entries(update).filter(([, value]) => value !== undefined)

  if (bodyEntries.length === 0) {
    return
  }

  try {
    const response = await $fetch<OrderDetailResponse>(`/api/orders/${order.value.id}`, {
      method: 'PATCH',
      body: Object.fromEntries(bodyEntries)
    })

    orderResponse.value = response
    order.value = response.order

    toast.add({
      title: 'Order updated',
      description: 'Changes saved successfully.'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update order'
    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error'
    })
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2
  }).format(amount)
}

function formatOrderDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, hh:mm a')
}

function formatPaymentMethod(value: string) {
  return value.replace(/_/g, ' ')
}

function onStatusChange(value: string | null) {
  if (!value || !order.value || value === order.value.status) {
    return
  }

  updateOrder({ status: value as OrderDetail['status'] })
}

function onPaymentChange(value: string | null) {
  if (!value || !order.value || value === order.value.paymentMethod) {
    return
  }

  updateOrder({ paymentMethod: value as OrderDetail['paymentMethod'] })
}

function getOrderSpacingText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '—'
}

async function handleShippingPhoneBlur() {
  if (!order.value) {
    return
  }

  const next = shippingFields.phone.trim()

  if ((order.value.shippingPhone ?? '') === next) {
    return
  }

  await updateOrder({ shippingPhone: next })
}

async function handleShippingWhatsappBlur() {
  if (!order.value) {
    return
  }

  const next = shippingFields.whatsapp.trim()

  if ((order.value.shippingWhatsapp ?? '') === next) {
    return
  }

  await updateOrder({ shippingWhatsapp: next })
}

async function handleShippingStreetBlur() {
  if (!order.value) {
    return
  }

  const next = shippingFields.street.trim()

  if ((order.value.shippingStreet ?? '') === next) {
    return
  }

  await updateOrder({ shippingStreet: next })
}

async function handleShippingCityBlur() {
  if (!order.value) {
    return
  }

  const next = shippingFields.city.trim()

  if ((order.value.shippingCity ?? '') === next) {
    return
  }

  await updateOrder({ shippingCity: next })
}

async function handleShippingCountryBlur() {
  if (!order.value) {
    return
  }

  const next = shippingFields.country.trim()

  if ((order.value.shippingCountry ?? '') === next) {
    return
  }

  await updateOrder({ shippingCountry: next })
}
</script>

<template>
  <UDashboardPanel :loading="status === 'pending'">
    <template #header>
      <UDashboardNavbar :title="order ? `Order #${order.orderNumber}` : 'Order'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
            @click="navigateTo('/orders')"
          >
            Back to orders
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="Unable to load order"
        :description="error?.message ?? 'Something went wrong'"
      />

      <template v-else-if="order">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section class="space-y-4 rounded-lg border border-default p-6 lg:col-span-8">
            <header class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-sm text-muted">
                  Order number
                </p>
                <h2 class="text-2xl font-semibold text-highlighted">
                  {{ order.orderNumber }}
                </h2>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  :color="order.status === 'DELIVERED' ? 'success' : order.status === 'SHIPPING' ? 'primary' : 'warning'"
                >
                  {{ order.status }}
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  {{ formatPaymentMethod(order.paymentMethod) }}
                </UBadge>
              </div>
            </header>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm text-muted">
                  Customer
                </p>
                <p class="font-medium text-highlighted">
                  {{ order.customerName }}
                </p>
                <p class="text-sm text-muted">
                  {{ getOrderSpacingText(order.customerEmail) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-muted">
                  Placed on
                </p>
                <p class="font-medium text-highlighted">
                  {{ formatOrderDate(order.createdAt) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-muted">
                  Payment method
                </p>
                <p class="font-medium text-highlighted">
                  {{ formatPaymentMethod(order.paymentMethod) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-muted">
                  Totals
                </p>
                <p class="font-medium text-highlighted">
                  {{ formatCurrency(order.totalAmount) }}
                </p>
                <p class="text-sm text-muted">
                  Shipping: {{ formatCurrency(order.shippingCost) }}
                </p>
              </div>
            </div>

            <div class="border-t border-default pt-4">
              <h3 class="text-lg font-semibold text-highlighted">
                Items
              </h3>
              <ul class="divide-y divide-default">
                <li v-for="item in order.items" :key="item.id" class="flex items-center justify-between py-3">
                  <div>
                    <p class="font-medium text-highlighted">
                      {{ item.productName ?? 'Unnamed product' }}
                    </p>
                    <p class="text-sm text-muted">
                      Qty: {{ item.quantity }} • {{ formatCurrency(item.unitPrice) }} / unit
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium text-highlighted">
                      {{ formatCurrency(item.totalPrice) }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ item.status }}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <aside class="space-y-6 lg:col-span-4">
            <section class="space-y-4 rounded-lg border border-default p-6">
              <h3 class="text-lg font-semibold text-highlighted">
                Update status
              </h3>
              <USelect
                :model-value="order.status"
                :items="statusOptions"
                @update:model-value="onStatusChange"
              />
              <USelect
                :model-value="order.paymentMethod"
                :items="paymentOptions"
                @update:model-value="onPaymentChange"
              />
            </section>

            <section class="space-y-4 rounded-lg border border-default p-6">
              <h3 class="text-lg font-semibold text-highlighted">
                Shipping details
              </h3>
              <UInput
                v-model="shippingFields.phone"
                placeholder="Shipping phone"
                @blur="handleShippingPhoneBlur"
              />
              <UInput
                v-model="shippingFields.whatsapp"
                placeholder="Whatsapp number"
                @blur="handleShippingWhatsappBlur"
              />
              <UInput
                v-model="shippingFields.street"
                placeholder="Street address"
                @blur="handleShippingStreetBlur"
              />
              <UInput
                v-model="shippingFields.city"
                placeholder="City"
                @blur="handleShippingCityBlur"
              />
              <UInput
                v-model="shippingFields.country"
                placeholder="Country"
                @blur="handleShippingCountryBlur"
              />
            </section>

            <UButton
              icon="i-lucide-refresh-ccw"
              color="neutral"
              variant="outline"
              :loading="status === 'pending'"
              class="w-full"
              @click="() => refresh()"
            >
              Refresh data
            </UButton>
          </aside>
        </div>
      </template>

      <USkeleton v-else height="200" class="mt-6" />
    </template>
  </UDashboardPanel>
</template>
