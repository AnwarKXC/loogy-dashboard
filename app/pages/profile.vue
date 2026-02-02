<script setup lang="ts">
const { locale } = useI18n()
const toast = useToast()

// Cookie for auth token persistence (no expiry - lasts until regenerated)
const authTokenCookie = useCookie('customer_auth_token', {
  maxAge: 60 * 60 * 24 * 365 * 10, // 10 years (effectively forever)
  sameSite: 'lax'
})

// State
const phone = ref('')
const phoneError = ref('')
const loading = ref(false)
const isAuthenticated = ref(false)

// OTP verification state
const {
  sendCode: sendOtpCode,
  verifyCode: verifyOtpCode,
  codeSent: otpCodeSent,
  loading: otpLoading,
  error: otpError,
  cooldownSeconds,
  attemptsRemaining,
  reset: resetOtp
} = usePhoneOtp()
const otpCode = ref('')

// Types
interface OrderItem {
  id: number
  quantity: number
  price: number
  totalPrice: number
  product: {
    id: number
    slug: string
    images: string[]
    translations: Array<{ lang: string, name: string }>
  }
}

interface Order {
  id: number
  customerName: string
  customerPhone: string
  status: string
  subtotal: number
  discount: number | null
  shippingCost: number
  totalAmount: number
  paymentMethod: string
  createdAt: string
  updatedAt: string
  shippingStreet: string
  shippingCity: string
  governorate: { id: number, nameEn: string, nameAr: string } | null
  area: { id: number, nameEn: string, nameAr: string } | null
  items: OrderItem[]
  timeline: Array<{ status: string, note: string | null, createdAt: string }>
}

interface Customer {
  name: string
  phone: string
  totalOrders: number
  totalSpent: number
}

interface OrdersResponse {
  found: boolean
  phone: string
  customer: Customer | null
  orders: Order[]
}

const customer = ref<Customer | null>(null)
const orders = ref<Order[]>([])
const expandedOrderId = ref<number | null>(null)
const authenticatedPhone = ref<string | null>(null)

// Fetch contact settings for WhatsApp
const { data: contactSettings } = await useFetch<{ phoneNumber: string | null }>('/api/public/settings/contact')

// Egyptian phone validation
const validateEgyptianPhone = (phoneValue: string): boolean => {
  const cleaned = phoneValue.replace(/[\s\-()]/g, '')
  const egyptPhoneRegex = /^(\+20|0)(10|11|12|15)\d{8}$/
  return egyptPhoneRegex.test(cleaned)
}

// Handle phone input with limiting
const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value

  // Only allow digits and + at the start
  value = value.replace(/[^\d+]/g, '')
  if (value.indexOf('+') > 0) {
    value = value.replace(/\+/g, '')
  }

  // Limit length based on format
  if (value.startsWith('+20')) {
    value = value.slice(0, 13)
  } else if (value.startsWith('0')) {
    value = value.slice(0, 11)
  } else if (value.startsWith('+')) {
    value = value.slice(0, 13)
  } else {
    value = value.slice(0, 11)
  }

  phone.value = value

  // Validate
  if (value.length >= 11) {
    if (!validateEgyptianPhone(value)) {
      phoneError.value = locale.value === 'ar'
        ? 'رقم غير صحيح. مثال: 01012345678 أو +201012345678'
        : 'Invalid number. Example: 01012345678 or +201012345678'
    } else {
      phoneError.value = ''
    }
  } else {
    phoneError.value = ''
  }
}

// Send OTP
const handleSendOtp = async () => {
  if (!validateEgyptianPhone(phone.value)) {
    toast.add({
      title: locale.value === 'ar' ? 'خطأ' : 'Error',
      description: locale.value === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number',
      color: 'error'
    })
    return
  }
  await sendOtpCode(phone.value)
}

// Verify OTP and get token
const handleVerifyOtp = async () => {
  if (otpCode.value.length !== 6) {
    toast.add({
      title: locale.value === 'ar' ? 'خطأ' : 'Error',
      description: locale.value === 'ar' ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code',
      color: 'error'
    })
    return
  }

  const success = await verifyOtpCode(phone.value, otpCode.value)
  if (success) {
    // The token is returned from the verify API - fetch it
    try {
      const result = await $fetch<{ success: boolean, token: string }>('/api/public/otp/verify', {
        method: 'POST',
        body: { phone: phone.value, code: otpCode.value }
      })
      if (result.token) {
        authTokenCookie.value = result.token
        await fetchOrdersWithToken(result.token)
        toast.add({
          title: locale.value === 'ar' ? 'تم التحقق!' : 'Verified!',
          description: locale.value === 'ar' ? 'تم التحقق من رقم هاتفك بنجاح' : 'Your phone number has been verified',
          color: 'success'
        })
      }
    } catch {
      // Token might already be verified from the composable call
      // Try to fetch orders anyway if we have a token in cookie
      if (authTokenCookie.value) {
        await fetchOrdersWithToken(authTokenCookie.value)
      }
    }
  }
}

// Fetch orders using auth token
const fetchOrdersWithToken = async (token: string) => {
  loading.value = true
  try {
    const response = await $fetch<OrdersResponse>('/api/public/orders/my-orders', {
      query: { token }
    })

    if (response.found && response.customer) {
      customer.value = response.customer
      orders.value = response.orders
      authenticatedPhone.value = response.phone
      isAuthenticated.value = true
    } else {
      toast.add({
        title: locale.value === 'ar' ? 'لا توجد طلبات' : 'No orders found',
        description: locale.value === 'ar'
          ? 'لم نجد أي طلبات مرتبطة بهذا الرقم'
          : 'We couldn\'t find any orders associated with this phone number',
        color: 'warning'
      })
      isAuthenticated.value = true // Still authenticated, just no orders
      authenticatedPhone.value = response.phone
    }
  } catch {
    // Token invalid - clear it
    authTokenCookie.value = null
    toast.add({
      title: locale.value === 'ar' ? 'جلسة منتهية' : 'Session expired',
      description: locale.value === 'ar' ? 'يرجى التحقق من رقم هاتفك مرة أخرى' : 'Please verify your phone number again',
      color: 'warning'
    })
  } finally {
    loading.value = false
  }
}

// Change phone number (go back to verification)
const changePhoneNumber = () => {
  resetOtp()
  otpCode.value = ''
  phone.value = ''
}

// Logout - clear token and reset state
const logout = () => {
  authTokenCookie.value = null
  isAuthenticated.value = false
  customer.value = null
  orders.value = []
  phone.value = ''
  authenticatedPhone.value = null
  resetOtp()
  otpCode.value = ''
}

// Format currency
const formatPrice = (price: number) => {
  return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(price) + ' EGP'
}

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Get product name
const getProductName = (product: OrderItem['product']) => {
  const translation = product?.translations?.find(t => t.lang === locale.value.toUpperCase())
  return translation?.name || product?.translations?.[0]?.name || 'Product'
}

// Get status color
const getStatusColor = (status: string): 'warning' | 'info' | 'primary' | 'success' | 'error' | 'neutral' => {
  const colors: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'neutral'> = {
    PENDING: 'warning',
    PROCESSING: 'info',
    SHIPPING: 'primary',
    DELIVERED: 'success',
    CANCELLED: 'error',
    RETURNED: 'neutral'
  }
  return colors[status] || 'neutral'
}

// Get status label
const getStatusLabel = (status: string) => {
  const labels: Record<string, { en: string, ar: string }> = {
    PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
    PROCESSING: { en: 'Processing', ar: 'قيد المعالجة' },
    SHIPPING: { en: 'Shipping', ar: 'قيد الشحن' },
    DELIVERED: { en: 'Delivered', ar: 'تم التوصيل' },
    CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
    RETURNED: { en: 'Returned', ar: 'مرتجع' }
  }
  return labels[status]?.[locale.value as 'en' | 'ar'] || status
}

// Generate WhatsApp URL for order follow-up
const getWhatsAppUrl = (orderId: number) => {
  if (!contactSettings.value?.phoneNumber) return null

  const storePhone = contactSettings.value.phoneNumber.replace(/[^0-9]/g, '')
  const message = locale.value === 'ar'
    ? `مرحباً، أريد الاستفسار عن طلبي رقم #${orderId}`
    : `Hi, I want to inquire about my order #${orderId}`

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`
}

// Toggle order expansion
const toggleOrder = (orderId: number) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

// Check token on mount
onMounted(async () => {
  if (authTokenCookie.value) {
    await fetchOrdersWithToken(authTokenCookie.value)
  }
})

// SEO
useHead({
  title: locale.value === 'ar' ? 'طلباتي' : 'My Orders'
})

definePageMeta({
  layout: 'storefront'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Phone Verification Section (Not Authenticated) -->
      <div v-if="!isAuthenticated" class="max-w-md mx-auto">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <UIcon name="i-simple-icons-whatsapp" class="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ locale === 'ar' ? 'طلباتي' : 'My Orders' }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ locale === 'ar' ? 'تحقق من رقم هاتفك لعرض جميع طلباتك' : 'Verify your phone number to view all your orders' }}
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <!-- Phone Input (before OTP sent) -->
          <div v-if="!otpCodeSent" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ locale === 'ar' ? 'رقم الهاتف' : 'Phone Number' }}
              </label>
              <div class="relative">
                <UIcon name="i-lucide-phone" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  v-model="phone"
                  type="tel"
                  dir="ltr"
                  :placeholder="locale === 'ar' ? '01012345678' : '01012345678'"
                  class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  :class="{ 'border-red-500 focus:ring-red-500': phoneError || otpError }"
                  @input="handlePhoneInput"
                  @keyup.enter="handleSendOtp"
                >
              </div>
              <p v-if="phoneError" class="mt-2 text-sm text-red-500 flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-4 h-4" />
                {{ phoneError }}
              </p>
              <p v-else-if="otpError" class="mt-2 text-sm text-red-500 flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-4 h-4" />
                {{ otpError }}
              </p>
            </div>

            <button
              :disabled="otpLoading || !phone || !!phoneError"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              @click="handleSendOtp"
            >
              <UIcon v-if="otpLoading" name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
              <UIcon v-else name="i-simple-icons-whatsapp" class="w-5 h-5" />
              {{ locale === 'ar' ? 'إرسال رمز التحقق' : 'Send Verification Code' }}
            </button>
          </div>

          <!-- OTP Input (after sent) -->
          <div v-else class="space-y-4">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p class="text-green-700 dark:text-green-300 text-sm">
                {{ locale === 'ar' ? 'تم إرسال رمز التحقق إلى' : 'Verification code sent to' }}
                <span class="font-mono font-bold block mt-1" dir="ltr">{{ phone }}</span>
              </p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                {{ locale === 'ar' ? 'أدخل رمز التحقق' : 'Enter Verification Code' }}
              </label>
              <input
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                class="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 px-4 py-4 text-2xl text-center font-mono tracking-[0.5em] focus:outline-none focus:border-green-500 transition-colors rounded-lg"
                :class="{ 'border-red-500': otpError }"
                @keyup.enter="handleVerifyOtp"
              >
              <p v-if="otpError" class="mt-2 text-sm text-red-500 text-center">
                {{ otpError }}
              </p>
              <p v-else class="mt-2 text-xs text-gray-500 text-center">
                {{ locale === 'ar' ? `المحاولات المتبقية: ${attemptsRemaining}` : `Attempts remaining: ${attemptsRemaining}` }}
              </p>
            </div>

            <button
              :disabled="otpLoading || otpCode.length !== 6"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              @click="handleVerifyOtp"
            >
              <UIcon v-if="otpLoading" name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
              <UIcon v-else name="i-lucide-check" class="w-5 h-5" />
              {{ locale === 'ar' ? 'تحقق' : 'Verify' }}
            </button>

            <!-- Resend & Change Number -->
            <div class="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                :disabled="cooldownSeconds > 0 || otpLoading"
                @click="handleSendOtp"
              >
                <span v-if="cooldownSeconds > 0">
                  {{ locale === 'ar' ? `إعادة الإرسال (${cooldownSeconds}ث)` : `Resend (${cooldownSeconds}s)` }}
                </span>
                <span v-else>
                  {{ locale === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code' }}
                </span>
              </button>
              <button
                class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                @click="changePhoneNumber"
              >
                {{ locale === 'ar' ? 'تغيير الرقم' : 'Change Number' }}
              </button>
            </div>
          </div>

          <!-- Quick track order link -->
          <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {{ locale === 'ar' ? 'لديك رقم طلب معين؟' : 'Have a specific order number?' }}
            </p>
            <NuxtLink
              to="/track-order"
              class="text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-search" class="w-4 h-4" />
              {{ locale === 'ar' ? 'تتبع طلب محدد' : 'Track a specific order' }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Profile Section (Authenticated) -->
      <template v-else>
        <!-- Customer Header -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <UIcon name="i-lucide-user" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ locale === 'ar' ? 'مرحباً' : 'Welcome' }}{{ customer?.name ? `, ${customer.name}` : '' }}
                </h1>
                <p class="text-gray-500 dark:text-gray-400" dir="ltr">
                  {{ authenticatedPhone || customer?.phone }}
                </p>
              </div>
            </div>
            <button
              class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
              @click="logout"
            >
              <UIcon name="i-lucide-log-out" class="w-4 h-4" />
              {{ locale === 'ar' ? 'تسجيل خروج' : 'Switch Account' }}
            </button>
          </div>

          <!-- Stats -->
          <div v-if="customer" class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div class="text-center">
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {{ customer.totalOrders }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ locale === 'ar' ? 'إجمالي الطلبات' : 'Total Orders' }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatPrice(customer.totalSpent) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ locale === 'ar' ? 'إجمالي المشتريات' : 'Total Spent' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6">
          <NuxtLink
            to="/track-order"
            class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-package-search" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ locale === 'ar' ? 'تتبع طلب برقمه' : 'Track Order by Number' }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ locale === 'ar' ? 'أدخل رقم الطلب للتتبع' : 'Enter order number to track' }}
                </p>
              </div>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400" :class="{ 'rotate-180': locale === 'ar' }" />
          </NuxtLink>
        </div>

        <!-- Orders List -->
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-package" class="w-5 h-5" />
          {{ locale === 'ar' ? 'طلباتي' : 'My Orders' }}
        </h2>

        <div v-if="orders.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
          <UIcon name="i-lucide-package-x" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ locale === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet' }}
          </p>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            <UIcon name="i-lucide-shopping-bag" class="w-4 h-4" />
            {{ locale === 'ar' ? 'تسوق الآن' : 'Shop Now' }}
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="order in orders"
            :key="order.id"
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <!-- Order Header (Clickable) -->
            <button
              class="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
              @click="toggleOrder(order.id)"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-package" class="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-900 dark:text-white">
                      #{{ order.id }}
                    </span>
                    <UBadge :color="getStatusColor(order.status)" size="sm">
                      {{ getStatusLabel(order.status) }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(order.createdAt) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-bold text-gray-900 dark:text-white">
                  {{ formatPrice(order.totalAmount) }}
                </span>
                <UIcon
                  :name="expandedOrderId === order.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="w-5 h-5 text-gray-400"
                />
              </div>
            </button>

            <!-- Order Details (Expandable) -->
            <div v-if="expandedOrderId === order.id" class="border-t border-gray-100 dark:border-gray-700">
              <!-- Items -->
              <div class="p-4 space-y-3">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div class="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                    <img
                      v-if="item.product?.images?.[0]"
                      :src="item.product.images[0]"
                      :alt="getProductName(item.product)"
                      class="w-full h-full object-cover"
                    >
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <UIcon name="i-lucide-image" class="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <NuxtLink
                      :to="`/products/${item.product?.slug}`"
                      class="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                    >
                      {{ getProductName(item.product) }}
                    </NuxtLink>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatPrice(item.price) }} × {{ item.quantity }}
                    </p>
                  </div>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ formatPrice(item.totalPrice) }}
                  </span>
                </div>
              </div>

              <!-- Summary -->
              <div class="px-4 pb-4 space-y-2 text-sm">
                <div class="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{{ locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal' }}</span>
                  <span>{{ formatPrice(order.subtotal) }}</span>
                </div>
                <div v-if="order.discount" class="flex justify-between text-green-600">
                  <span>{{ locale === 'ar' ? 'الخصم' : 'Discount' }}</span>
                  <span>-{{ formatPrice(order.discount) }}</span>
                </div>
                <div class="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{{ locale === 'ar' ? 'الشحن' : 'Shipping' }}</span>
                  <span>{{ formatPrice(order.shippingCost) }}</span>
                </div>
                <div class="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span>{{ locale === 'ar' ? 'الإجمالي' : 'Total' }}</span>
                  <span>{{ formatPrice(order.totalAmount) }}</span>
                </div>
              </div>

              <!-- Address -->
              <div class="px-4 pb-4">
                <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Address' }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ order.shippingStreet }}
                    <template v-if="order.area">
                      <br>{{ locale === 'ar' ? order.area.nameAr : order.area.nameEn }}
                    </template>
                    <template v-if="order.governorate">
                      , {{ locale === 'ar' ? order.governorate.nameAr : order.governorate.nameEn }}
                    </template>
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="px-4 pb-4 flex flex-wrap gap-2">
                <NuxtLink
                  :to="`/track-order?orderNumber=${order.id}`"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                  <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
                  {{ locale === 'ar' ? 'تتبع الطلب' : 'Track Order' }}
                </NuxtLink>
                <a
                  v-if="getWhatsAppUrl(order.id)"
                  :href="getWhatsAppUrl(order.id)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                >
                  <UIcon name="i-simple-icons-whatsapp" class="w-5 h-5" />
                  {{ locale === 'ar' ? 'استفسار' : 'Inquire' }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
