<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

const { locale } = useI18n()
const route = useRoute()

useSeoMeta({
  title: () => locale.value === 'ar' ? 'تتبع طلبك' : 'Track Your Order',
  robots: 'noindex, nofollow'
})

const toast = useToast()

// Order lookup
const orderIdInput = ref('')
const loading = ref(false)
const orderNotFound = ref(false)

interface OrderItem {
  id: number
  productName: { en?: string, ar?: string } | string
  quantity: number
  price: number
  totalPrice: number
}

interface Order {
  id: number
  status: string
  customerName: string
  customerPhone: string
  shippingCity: string
  shippingStreet: string
  subtotal: number
  discount: number | null
  shippingCost: number
  totalAmount: number
  paymentMethod: string
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

const order = ref<Order | null>(null)

// Handle order ID input
const handleOrderIdInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // Allow only digits
  orderIdInput.value = input.value.replace(/\D/g, '')
}

// Lookup order by ID
const lookupOrder = async () => {
  if (!orderIdInput.value) {
    toast.add({
      title: locale.value === 'ar' ? 'خطأ' : 'Error',
      description: locale.value === 'ar' ? 'يرجى إدخال رقم الطلب' : 'Please enter an order number',
      color: 'error'
    })
    return
  }

  loading.value = true
  orderNotFound.value = false
  order.value = null

  try {
    const result = await $fetch<Order>(`/api/public/orders/${orderIdInput.value}`)
    order.value = result
  } catch {
    orderNotFound.value = true
  } finally {
    loading.value = false
  }
}

// Check for orderNumber query param on mount
onMounted(() => {
  const orderNumber = route.query.orderNumber as string
  if (orderNumber) {
    orderIdInput.value = orderNumber.replace(/\D/g, '')
    if (orderIdInput.value) {
      lookupOrder()
    }
  }
})

// Format price
const formatPrice = (value: number) => {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${locale.value === 'ar' ? 'ج.م' : 'EGP'}`
}

// Get product name
const getProductName = (name: OrderItem['productName']) => {
  if (typeof name === 'string') return name
  return locale.value === 'ar' ? (name.ar || name.en || 'Product') : (name.en || name.ar || 'Product')
}

// Status labels and colors
const statusConfig: Record<string, { label: { en: string, ar: string }, color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'neutral', icon: string }> = {
  PENDING: { label: { en: 'Pending', ar: 'قيد الانتظار' }, color: 'warning', icon: 'i-lucide-clock' },
  PROCESSING: { label: { en: 'Processing', ar: 'جاري التحضير' }, color: 'info', icon: 'i-lucide-package' },
  SHIPPING: { label: { en: 'Shipping', ar: 'جاري الشحن' }, color: 'primary', icon: 'i-lucide-truck' },
  DELIVERED: { label: { en: 'Delivered', ar: 'تم التوصيل' }, color: 'success', icon: 'i-lucide-check-circle' },
  CANCELLED: { label: { en: 'Cancelled', ar: 'ملغي' }, color: 'error', icon: 'i-lucide-x-circle' },
  RETURNED: { label: { en: 'Returned', ar: 'مرتجع' }, color: 'neutral', icon: 'i-lucide-undo-2' }
}

const getStatusLabel = (status: string) => {
  const config = statusConfig[status]
  if (!config) return status
  return locale.value === 'ar' ? config.label.ar : config.label.en
}

const getStatusColor = (status: string) => {
  return statusConfig[status]?.color || 'neutral'
}

const getStatusIcon = (status: string) => {
  return statusConfig[status]?.icon || 'i-lucide-help-circle'
}

// Reset search
const resetSearch = () => {
  orderIdInput.value = ''
  order.value = null
  orderNotFound.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F8F8] dark:bg-gray-900 py-10" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="container mx-auto px-4 sm:px-6 max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <div class="size-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <UIcon name="i-lucide-package-search" class="size-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 class="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">
          {{ locale === 'ar' ? 'تتبع طلبك' : 'Track Your Order' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ locale === 'ar' ? 'أدخل رقم الطلب للاطلاع على حالته' : 'Enter your order number to check its status' }}
        </p>
      </div>

      <!-- Search Form -->
      <div v-if="!order" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {{ locale === 'ar' ? 'رقم الطلب' : 'Order Number' }}
            </label>
            <input
              :value="orderIdInput"
              type="text"
              inputmode="numeric"
              :placeholder="locale === 'ar' ? 'مثال: 123' : 'Example: 123'"
              class="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 px-4 py-4 text-lg text-center font-mono focus:outline-none focus:border-primary-500 transition-colors rounded-lg"
              :class="{ 'border-red-500': orderNotFound }"
              @input="handleOrderIdInput"
              @keyup.enter="lookupOrder"
            >
            <p v-if="orderNotFound" class="mt-2 text-sm text-red-500 text-center">
              {{ locale === 'ar' ? 'لم يتم العثور على الطلب' : 'Order not found' }}
            </p>
          </div>

          <button
            class="w-full bg-black dark:bg-white text-white dark:text-black px-6 py-4 font-bold text-lg rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            :disabled="loading || !orderIdInput"
            @click="lookupOrder"
          >
            <UIcon v-if="loading" name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
            <UIcon v-else name="i-lucide-search" class="w-5 h-5" />
            {{ locale === 'ar' ? 'بحث' : 'Search' }}
          </button>
        </div>
      </div>

      <!-- Order Details -->
      <div v-else class="space-y-6">
        <!-- Order Header -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ locale === 'ar' ? 'رقم الطلب' : 'Order Number' }}
              </p>
              <p class="text-2xl font-bold font-mono">
                #{{ order.id }}
              </p>
            </div>
            <UBadge :color="getStatusColor(order.status)" size="lg" class="gap-1">
              <UIcon :name="getStatusIcon(order.status)" class="w-4 h-4" />
              {{ getStatusLabel(order.status) }}
            </UBadge>
          </div>

          <div class="border-t dark:border-gray-700 pt-4 mt-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ locale === 'ar' ? 'تاريخ الطلب' : 'Order Date' }}
            </p>
            <p class="font-medium">
              {{ new Date(order.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) }}
            </p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 class="font-bold text-lg mb-4">
            {{ locale === 'ar' ? 'المنتجات' : 'Items' }}
          </h3>
          <div class="space-y-4">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0"
            >
              <div class="flex-1">
                <p class="font-medium">
                  {{ getProductName(item.productName) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatPrice(item.price) }} × {{ item.quantity }}
                </p>
              </div>
              <p class="font-bold">
                {{ formatPrice(item.totalPrice) }}
              </p>
            </div>
          </div>

          <!-- Totals -->
          <div class="border-t dark:border-gray-700 pt-4 mt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal' }}</span>
              <span>{{ formatPrice(order.subtotal) }}</span>
            </div>
            <div v-if="order.discount" class="flex justify-between text-sm text-green-600">
              <span>{{ locale === 'ar' ? 'الخصم' : 'Discount' }}</span>
              <span>-{{ formatPrice(order.discount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ locale === 'ar' ? 'الشحن' : 'Shipping' }}</span>
              <span>{{ formatPrice(order.shippingCost) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-700">
              <span>{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</span>
              <span>{{ formatPrice(order.totalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Shipping Info -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 class="font-bold text-lg mb-4">
            {{ locale === 'ar' ? 'معلومات الشحن' : 'Shipping Information' }}
          </h3>
          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-500">
                {{ locale === 'ar' ? 'الاسم' : 'Name' }}
              </p>
              <p class="font-medium">
                {{ order.customerName }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                {{ locale === 'ar' ? 'الهاتف' : 'Phone' }}
              </p>
              <p class="font-medium font-mono">
                {{ order.customerPhone }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">
                {{ locale === 'ar' ? 'العنوان' : 'Address' }}
              </p>
              <p class="font-medium">
                {{ order.shippingCity }}, {{ order.shippingStreet }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4">
          <button
            class="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-4 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            @click="resetSearch"
          >
            {{ locale === 'ar' ? 'بحث عن طلب آخر' : 'Search Another Order' }}
          </button>
          <NuxtLink
            to="/"
            class="flex-1 bg-black dark:bg-white text-white dark:text-black px-6 py-4 font-bold rounded-lg text-center hover:opacity-90 transition-colors"
          >
            {{ locale === 'ar' ? 'العودة للمتجر' : 'Back to Store' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
