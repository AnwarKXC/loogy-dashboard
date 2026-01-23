<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'

definePageMeta({
  layout: 'storefront',
  middleware: () => {
    // Check cart cookie on client side
    if (import.meta.client) {
      const cartCookie = useCookie<{ items: Array<{ productId: number }> }>('storefront_cart')
      const cartItems = cartCookie.value?.items || []
      if (cartItems.length === 0) {
        return navigateTo('/cart')
      }
    }
  }
})

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('checkout.title'),
  robots: 'noindex, nofollow'
})

interface PricingSettings {
  shippingFee: number
  minOrderValue: number
  maxOrderValue: number | null
  bulkDiscountThreshold: number | null
  bulkDiscountPercentage: number | null
  currency: string
}

interface PromoValidation {
  valid: boolean
  code: string
  applicationType: 'PERCENTAGE' | 'FIXED'
  value: number
  discountAmount: number
  message: string
}

interface ShippingZone {
  id: number
  name: string
  price: number
  freeShippingThreshold: number | null
  estimatedDays: string | null
}

interface GovernorateFromAPI {
  id: number
  slug: string
  name: string
  nameEn: string
  nameAr: string
  shippingPrice: number | null
  shippingZone: ShippingZone | null
}

interface AreaFromAPI {
  id: number
  slug: string
  name: string
  nameEn: string
  nameAr: string
}

const toast = useToast()
const { lines, subtotal, clear: clearCart } = useCart()
const router = useRouter()

// Steps (removed SHIPPING - shipping calculated based on location)
const steps = ['INFORMATION', 'PAYMENT'] as const
const currentStep = ref<typeof steps[number]>('INFORMATION')

// Governorates data from API
const governorates = ref<GovernorateFromAPI[]>([])
const areas = ref<AreaFromAPI[]>([])
const areasLoading = ref(false)

// Form state
const form = reactive({
  phone: '',
  fullName: '',
  governorateId: null as number | null,
  areaId: null as number | null,
  fullLocation: '',
  whatsapp: '',
  email: '',
  payment: 'cod'
})

// Form errors
const errors = reactive({
  phone: '',
  fullName: '',
  governorate: '',
  area: '',
  fullLocation: ''
})

// Pricing state
const pricingSettings = ref<PricingSettings | null>(null)
const pricingLoading = ref(true)

// Promo code state
const promoCode = ref('')
const promoLoading = ref(false)
const appliedPromo = ref<PromoValidation | null>(null)
const promoError = ref('')

// Fetch governorates from API
const { data: governoratesResponse } = await useFetch<{ governorates: GovernorateFromAPI[] }>('/api/shipping/governorates', {
  query: { lang: locale }
})

watch(governoratesResponse, (data) => {
  if (data?.governorates) {
    governorates.value = data.governorates
  }
}, { immediate: true })

// Fetch pricing settings
const { data: pricingData } = await useFetch<PricingSettings>('/api/public/pricing')

watch(pricingData, (data) => {
  if (data) {
    pricingSettings.value = data
  } else {
    pricingSettings.value = {
      shippingFee: 50,
      minOrderValue: 0,
      maxOrderValue: null,
      bulkDiscountThreshold: null,
      bulkDiscountPercentage: null,
      currency: 'EGP'
    }
  }
  pricingLoading.value = false
}, { immediate: true })

// Computed: List of governorates with labels
const governoratesList = computed(() => {
  return governorates.value.map(gov => ({
    value: gov.id,
    label: locale.value === 'ar' ? gov.nameAr : gov.nameEn,
    labelEn: gov.nameEn,
    labelAr: gov.nameAr,
    shippingPrice: gov.shippingPrice
  }))
})

// Computed: List of areas for selected governorate
const areasList = computed(() => {
  return areas.value.map(area => ({
    value: area.id,
    label: locale.value === 'ar' ? area.nameAr : area.nameEn,
    labelEn: area.nameEn,
    labelAr: area.nameAr
  }))
})

// Fetch areas when governorate changes
watch(() => form.governorateId, async (govId) => {
  form.areaId = null
  errors.area = ''
  areas.value = []

  if (govId) {
    areasLoading.value = true
    try {
      const response = await $fetch<{ governorate: unknown, areas: AreaFromAPI[] }>(
        `/api/shipping/governorates/${govId}/areas`,
        { query: { lang: locale.value } }
      )
      areas.value = response.areas
    } catch (error) {
      console.error('Failed to fetch areas:', error)
    } finally {
      areasLoading.value = false
    }
  }
})

// Get selected governorate info
const selectedGovernorate = computed(() => {
  if (!form.governorateId) return null
  return governorates.value.find(g => g.id === form.governorateId) || null
})

// Calculate shipping based on selected governorate
const shipping = computed(() => {
  if (selectedGovernorate.value?.shippingZone) {
    // Check free shipping threshold
    const zone = selectedGovernorate.value.shippingZone
    if (zone.freeShippingThreshold && subtotal.value >= zone.freeShippingThreshold) {
      return 0
    }
    return zone.price
  }
  // Fallback to default shipping fee
  return pricingSettings.value?.shippingFee ?? 50
})

// Check if free shipping applies
const hasFreeShipping = computed(() => {
  if (!selectedGovernorate.value?.shippingZone) return false
  const zone = selectedGovernorate.value.shippingZone
  return zone.freeShippingThreshold !== null && subtotal.value >= zone.freeShippingThreshold
})

// Estimated delivery days
const estimatedDelivery = computed(() => {
  return selectedGovernorate.value?.shippingZone?.estimatedDays || null
})

// Calculate bulk discount
const bulkDiscount = computed(() => {
  if (!pricingSettings.value?.bulkDiscountThreshold || !pricingSettings.value?.bulkDiscountPercentage) {
    return 0
  }
  if (subtotal.value >= pricingSettings.value.bulkDiscountThreshold) {
    return (subtotal.value * pricingSettings.value.bulkDiscountPercentage) / 100
  }
  return 0
})

// Calculate promo discount
const promoDiscount = computed(() => appliedPromo.value?.discountAmount ?? 0)

// Total discount
const totalDiscount = computed(() => bulkDiscount.value + promoDiscount.value)

// Final total
const total = computed(() => Math.max(0, subtotal.value - totalDiscount.value + shipping.value))

// Min order validation
const belowMinOrder = computed(() => {
  if (!pricingSettings.value?.minOrderValue) return false
  return subtotal.value < pricingSettings.value.minOrderValue
})

// Max order validation
const aboveMaxOrder = computed(() => {
  if (!pricingSettings.value?.maxOrderValue) return false
  return subtotal.value > pricingSettings.value.maxOrderValue
})

const isSubmitting = ref(false)
const orderComplete = ref(false)
const orderNumber = ref('')

const formatPrice = (value: number) => {
  const currencySymbol = pricingSettings.value?.currency === 'EGP' ? 'ج.م' : '$'
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currencySymbol}`
}

// Clear field error on input
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}

// Egyptian phone number validation
// Accepts: 01XXXXXXXXX (11 digits starting with 010, 011, 012, 015)
// Or: +201XXXXXXXXX (with country code)
const validateEgyptianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-()]/g, '') // Remove spaces, dashes, parentheses
  // Pattern: 01[0125]XXXXXXXX (11 digits) or +201[0125]XXXXXXXX (13 chars with +)
  const egyptPhoneRegex = /^(\+20|0)(10|11|12|15)\d{8}$/
  return egyptPhoneRegex.test(cleaned)
}

// Normalize phone to standard format (+201XXXXXXXXX)
const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+20')) {
    return cleaned
  }
  if (cleaned.startsWith('0')) {
    return '+2' + cleaned
  }
  return cleaned
}

// Phone input handler - limit to valid characters and length
const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // Allow only digits and + at the start
  let value = input.value.replace(/[^\d+]/g, '')

  // Only allow + at the very beginning
  if (value.includes('+') && !value.startsWith('+')) {
    value = value.replace(/\+/g, '')
  }

  // Limit length: 11 for local (0...), 13 for international (+20...)
  if (value.startsWith('+')) {
    value = value.slice(0, 13)
  } else {
    value = value.slice(0, 11)
  }

  form.phone = value
  clearError('phone')

  // Trigger lookup if valid
  if (validateEgyptianPhone(value)) {
    lookupCustomerByPhone(value)
  } else {
    customerFound.value = false
  }
}

// Customer lookup state
const lookupLoading = ref(false)
const customerFound = ref(false)
let lookupTimeout: ReturnType<typeof setTimeout> | null = null

// Debounced customer lookup
const lookupCustomerByPhone = (phone: string) => {
  // Clear previous timeout
  if (lookupTimeout) {
    clearTimeout(lookupTimeout)
  }

  // Debounce 300ms
  lookupTimeout = setTimeout(async () => {
    if (!validateEgyptianPhone(phone)) {
      customerFound.value = false
      return
    }

    lookupLoading.value = true
    try {
      const response = await $fetch<{
        found: boolean
        customer?: {
          name: string
          email: string | null
          phone: string
          governorateId: number | null
          areaId: number | null
          address: string | null
          whatsapp: string
        }
      }>('/api/public/customer/lookup', {
        query: { phone }
      })

      if (response.found && response.customer) {
        customerFound.value = true
        // Auto-fill form with customer details
        form.fullName = response.customer.name || form.fullName
        form.email = response.customer.email || form.email

        // Set governorate first
        if (response.customer.governorateId) {
          form.governorateId = response.customer.governorateId
          // Wait for areas to load then set area
          await nextTick()
          // Areas will be loaded by the governorate watcher
          setTimeout(() => {
            if (response.customer?.areaId) {
              form.areaId = response.customer.areaId
            }
          }, 500)
        }

        // Set address - now stored cleanly without WhatsApp embedded
        if (response.customer.address) {
          // Handle legacy format that might have WhatsApp embedded
          const whatsappMatch = response.customer.address.match(/\s*\(WhatsApp:\s*([^)]+)\)$/)
          if (whatsappMatch) {
            form.fullLocation = response.customer.address.replace(/\s*\(WhatsApp:\s*[^)]+\)$/, '').trim()
            form.whatsappNumber = whatsappMatch[1].trim()
          } else {
            form.fullLocation = response.customer.address
          }
        }

        // Set WhatsApp if provided separately (new format)
        if (response.customer.whatsapp) {
          form.whatsappNumber = response.customer.whatsapp
        }

        toast.add({
          title: locale.value === 'ar' ? 'مرحباً بعودتك!' : 'Welcome back!',
          description: locale.value === 'ar' ? 'تم ملء بياناتك من طلبك السابق' : 'Your details have been filled from your previous order',
          color: 'success',
          icon: 'i-lucide-user-check'
        })
      } else {
        customerFound.value = false
      }
    } catch {
      customerFound.value = false
    } finally {
      lookupLoading.value = false
    }
  }, 300)
}

// Validate form
const validateForm = (): boolean => {
  let isValid = true

  // Reset errors
  errors.phone = ''
  errors.fullName = ''
  errors.governorate = ''
  errors.area = ''
  errors.fullLocation = ''

  if (!form.phone.trim()) {
    errors.phone = locale.value === 'ar'
      ? 'رقم الهاتف مطلوب'
      : 'Phone number is required'
    isValid = false
  } else if (!validateEgyptianPhone(form.phone)) {
    errors.phone = locale.value === 'ar'
      ? 'أدخل رقم مصري صحيح: 01012345678 أو +201012345678'
      : 'Enter a valid Egyptian number: 01012345678 or +201012345678'
    isValid = false
  }

  if (!form.fullName.trim()) {
    errors.fullName = t('checkout.validation.fullNameRequired')
    isValid = false
  }

  if (!form.governorateId) {
    errors.governorate = t('checkout.validation.governorateRequired')
    isValid = false
  }

  if (!form.areaId) {
    errors.area = t('checkout.validation.areaRequired')
    isValid = false
  }

  if (!form.fullLocation.trim()) {
    errors.fullLocation = t('checkout.validation.locationRequired')
    isValid = false
  }

  return isValid
}

// Apply promo code
const applyPromoCode = async () => {
  if (!promoCode.value.trim()) {
    promoError.value = t('checkout.order.promoCode')
    return
  }

  promoLoading.value = true
  promoError.value = ''

  try {
    const result = await $fetch<PromoValidation>('/api/public/promo/validate', {
      method: 'POST',
      body: {
        code: promoCode.value.trim(),
        subtotal: subtotal.value
      }
    })

    appliedPromo.value = result
    toast.add({
      title: t('checkout.order.promoApplied'),
      description: result.message,
      color: 'success'
    })
  } catch (error: unknown) {
    const dataMessage = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    promoError.value = typeof dataMessage === 'string' ? dataMessage : 'Invalid code'
    appliedPromo.value = null
  } finally {
    promoLoading.value = false
  }
}

// Remove promo code
const removePromoCode = () => {
  appliedPromo.value = null
  promoCode.value = ''
  promoError.value = ''
}

const nextStep = () => {
  if (currentStep.value === 'INFORMATION') {
    if (validateForm()) {
      currentStep.value = 'PAYMENT'
    }
  }
}

const goToStep = (step: typeof steps[number]) => {
  const stepOrder = { INFORMATION: 1, PAYMENT: 2 }
  if (stepOrder[step] < stepOrder[currentStep.value]) {
    currentStep.value = step
  }
}

const placeOrder = async () => {
  if (lines.value.length === 0) {
    toast.add({
      title: t('checkout.validation.cartEmpty'),
      color: 'warning'
    })
    return
  }

  if (belowMinOrder.value) {
    toast.add({
      title: 'Minimum Order',
      description: `Minimum order is ${formatPrice(pricingSettings.value?.minOrderValue ?? 0)}`,
      color: 'warning'
    })
    return
  }

  if (aboveMaxOrder.value) {
    toast.add({
      title: 'Maximum Order',
      description: `Maximum order is ${formatPrice(pricingSettings.value?.maxOrderValue ?? 0)}`,
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true
  try {
    // Get governorate and area labels
    const selectedGov = governorates.value.find(g => g.id === form.governorateId)
    const selectedArea = areas.value.find(a => a.id === form.areaId)
    const govLabel = locale.value === 'ar' ? selectedGov?.nameAr : selectedGov?.nameEn
    const areaLabel = locale.value === 'ar' ? selectedArea?.nameAr : selectedArea?.nameEn

    const response = await $fetch('/api/public/orders', {
      method: 'POST',
      body: {
        customer: {
          name: form.fullName,
          phone: normalizePhone(form.phone),
          governorate: govLabel || '',
          governorateId: form.governorateId || null,
          areaId: form.areaId || null,
          address: `${areaLabel || ''}, ${form.fullLocation}`,
          whatsapp: form.whatsappNumber || ''
        },
        paymentMethod: form.payment,
        items: lines.value,
        promoCode: appliedPromo.value?.code ?? null,
        shippingCost: shipping.value
      }
    })

    // Save phone to cookie for profile access
    const phoneCookie = useCookie('customer_phone', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax'
    })
    phoneCookie.value = normalizePhone(form.phone)

    orderNumber.value = response.orderNumber
    orderComplete.value = true
    await clearCart()

    toast.add({
      title: t('checkout.success.title'),
      description: response.message,
      color: 'success'
    })
  } catch (error: unknown) {
    const dataMessage = (error as { data?: { message?: string } })?.data?.message
    const message = typeof dataMessage === 'string'
      ? dataMessage
      : t('checkout.errors.tryAgain')

    toast.add({
      title: t('checkout.errors.orderFailed'),
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Get step label based on locale
const getStepLabel = (step: string) => {
  const stepKeys: Record<string, string> = {
    INFORMATION: 'checkout.steps.information',
    PAYMENT: 'checkout.steps.payment'
  }
  return t(stepKeys[step] || step)
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F8F8] dark:bg-gray-900 pb-20" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Success State -->
    <div v-if="orderComplete" class="max-w-lg mx-auto py-20 px-4 text-center space-y-6">
      <div class="size-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <UIcon name="i-lucide-check" class="size-10 text-green-600 dark:text-green-400" />
      </div>
      <div class="space-y-2">
        <h1 class="text-3xl font-black text-gray-900 dark:text-gray-100">
          {{ $t('checkout.success.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('checkout.success.message') }}
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('checkout.success.orderNumber') }}: <span class="font-mono font-bold">{{ orderNumber }}</span>
        </p>
      </div>
      <div class="flex justify-center gap-4 pt-4">
        <button
          class="bg-black text-white dark:bg-white dark:text-black px-6 py-3 font-bold"
          @click="router.push('/')"
        >
          {{ $t('checkout.buttons.backToHome') }}
        </button>
      </div>
    </div>

    <div v-else class="container mx-auto px-4 sm:px-6 md:px-12 py-10 max-w-7xl">
      <!-- Header -->
      <div class="mb-10">
        <button
          class="mb-6 hover:opacity-70 transition-opacity"
          @click="currentStep === 'INFORMATION' ? router.push('/cart') : goToStep('INFORMATION')"
        >
          <UIcon
            :name="locale === 'ar' ? 'i-heroicons-arrow-long-right' : 'i-heroicons-arrow-long-left'"
            class="w-8 h-8 text-black dark:text-white"
          />
        </button>

        <h1 class="text-4xl font-black italic mb-6 tracking-tight text-black dark:text-white">
          {{ $t('checkout.title') }}
        </h1>

        <div class="flex gap-8 text-sm font-semibold tracking-wider">
          <button
            v-for="step in steps"
            :key="step"
            :class="[
              currentStep === step
                ? 'text-black dark:text-white'
                : 'text-gray-400 dark:text-gray-600'
            ]"
            @click="goToStep(step)"
          >
            {{ getStepLabel(step) }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <!-- Left Column: Forms -->
        <div class="lg:col-span-7 space-y-8">
          <!-- INFORMATION Step -->
          <div v-show="currentStep === 'INFORMATION'">
            <!-- Contact Info -->
            <div class="space-y-5 mb-10">
              <h2 class="text-sm font-bold tracking-widest uppercase text-black dark:text-white">
                {{ $t('checkout.contactInfo') }}
              </h2>

              <!-- Phone -->
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {{ $t('checkout.fields.phone') }} <span class="text-red-500">*</span>
                  <span v-if="lookupLoading" class="ml-2 inline-flex items-center">
                    <UIcon name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
                  </span>
                  <span v-else-if="customerFound" class="ml-2 text-green-600">
                    <UIcon name="i-lucide-check-circle" class="w-3 h-3 inline" />
                    {{ locale === 'ar' ? 'تم التعرف عليك' : 'Recognized' }}
                  </span>
                </label>
                <input
                  :value="form.phone"
                  type="tel"
                  inputmode="tel"
                  :placeholder="locale === 'ar' ? '01012345678' : '01012345678'"
                  class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  :class="{ 'border-red-500 dark:border-red-500': errors.phone, 'border-green-500 dark:border-green-500': customerFound && !errors.phone }"
                  @input="handlePhoneInput"
                >
                <p v-if="errors.phone" class="mt-1 text-xs text-red-500">
                  {{ errors.phone }}
                </p>
                <p v-else class="mt-1 text-xs text-gray-400">
                  {{ locale === 'ar' ? 'مثال: 01012345678 أو +201012345678' : 'Example: 01012345678 or +201012345678' }}
                </p>
              </div>

              <!-- Full Name -->
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {{ $t('checkout.fields.fullName') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.fullName"
                  type="text"
                  :placeholder="$t('checkout.fields.fullName')"
                  class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  :class="{ 'border-red-500 dark:border-red-500': errors.fullName }"
                  @input="clearError('fullName')"
                >
                <p v-if="errors.fullName" class="mt-1 text-xs text-red-500">
                  {{ errors.fullName }}
                </p>
              </div>
            </div>

            <!-- Shipping Address -->
            <div class="space-y-5">
              <h2 class="text-sm font-bold tracking-widest uppercase text-black dark:text-white">
                {{ $t('checkout.shippingAddress') }}
              </h2>

              <!-- Governorate Dropdown -->
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {{ $t('checkout.fields.selectGovernorate') }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="form.governorateId"
                    class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors appearance-none cursor-pointer"
                    :class="[
                      errors.governorate ? 'border-red-500 dark:border-red-500' : '',
                      !form.governorateId ? 'text-gray-500' : 'text-black dark:text-white'
                    ]"
                    @change="clearError('governorate')"
                  >
                    <option :value="null" disabled>
                      {{ $t('checkout.fields.selectGovernorate') }}
                    </option>
                    <option v-for="gov in governoratesList" :key="gov.value" :value="gov.value">
                      {{ gov.label }}
                    </option>
                  </select>
                  <UIcon
                    name="i-heroicons-chevron-down"
                    class="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    :class="locale === 'ar' ? 'left-4' : 'right-4'"
                  />
                </div>
                <p v-if="errors.governorate" class="mt-1 text-xs text-red-500">
                  {{ errors.governorate }}
                </p>
                <!-- Shipping info for selected governorate -->
                <div v-if="selectedGovernorate?.shippingZone" class="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <UIcon name="i-lucide-truck" class="w-4 h-4" />
                  <span v-if="hasFreeShipping" class="text-green-600 dark:text-green-400 font-medium">
                    {{ $t('checkout.order.freeShipping') }}
                  </span>
                  <span v-else>
                    {{ $t('checkout.order.shipping') }}: {{ formatPrice(shipping) }}
                  </span>
                  <span v-if="estimatedDelivery" class="text-gray-400">
                    • {{ estimatedDelivery }}
                  </span>
                </div>
              </div>

              <!-- Area Dropdown -->
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {{ $t('checkout.fields.selectArea') }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="form.areaId"
                    :disabled="!form.governorateId || areasLoading"
                    class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="[
                      errors.area ? 'border-red-500 dark:border-red-500' : '',
                      !form.areaId ? 'text-gray-500' : 'text-black dark:text-white'
                    ]"
                    @change="clearError('area')"
                  >
                    <option :value="null" disabled>
                      {{ areasLoading ? $t('checkout.loading') : $t('checkout.fields.selectArea') }}
                    </option>
                    <option v-for="area in areasList" :key="area.value" :value="area.value">
                      {{ area.label }}
                    </option>
                  </select>
                  <UIcon
                    v-if="!areasLoading"
                    name="i-heroicons-chevron-down"
                    class="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    :class="locale === 'ar' ? 'left-4' : 'right-4'"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-loader-2"
                    class="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none animate-spin"
                    :class="locale === 'ar' ? 'left-4' : 'right-4'"
                  />
                </div>
                <p v-if="errors.area" class="mt-1 text-xs text-red-500">
                  {{ errors.area }}
                </p>
              </div>

              <!-- Full Location Textarea -->
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {{ $t('checkout.fields.fullLocation') }} <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="form.fullLocation"
                  :placeholder="$t('checkout.fields.fullLocation')"
                  rows="3"
                  class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                  :class="{ 'border-red-500 dark:border-red-500': errors.fullLocation }"
                  @input="clearError('fullLocation')"
                />
                <p v-if="errors.fullLocation" class="mt-1 text-xs text-red-500">
                  {{ errors.fullLocation }}
                </p>
              </div>

              <!-- WhatsApp (Optional) -->
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {{ $t('checkout.fields.whatsapp') }}
                  <span class="text-gray-400 font-normal">({{ $t('checkout.optional') }})</span>
                </label>
                <input
                  v-model="form.whatsapp"
                  type="tel"
                  :placeholder="$t('checkout.fields.whatsapp')"
                  class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                >
              </div>
            </div>

            <div class="pt-8 flex" :class="locale === 'ar' ? 'justify-start' : 'justify-end'">
              <button
                class="bg-[#D9D9D9] hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white px-8 py-3 text-sm font-bold flex items-center gap-3 transition-colors uppercase"
                @click="nextStep"
              >
                {{ $t('checkout.buttons.payment') }}
                <UIcon
                  :name="locale === 'ar' ? 'i-heroicons-arrow-long-left' : 'i-heroicons-arrow-long-right'"
                  class="w-6 h-6"
                />
              </button>
            </div>
          </div>

          <!-- PAYMENT Step -->
          <div v-show="currentStep === 'PAYMENT'">
            <div class="space-y-5">
              <h2 class="text-sm font-bold tracking-widest uppercase text-black dark:text-white">
                {{ $t('checkout.paymentMethod') }}
              </h2>
              <div class="space-y-3">
                <label class="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer">
                  <input
                    v-model="form.payment"
                    type="radio"
                    value="cod"
                    class="w-4 h-4 text-black accent-black dark:accent-white"
                  >
                  <span class="font-medium text-black dark:text-white">{{ $t('checkout.order.cashOnDelivery') }}</span>
                </label>
                <label class="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer opacity-50">
                  <input
                    v-model="form.payment"
                    type="radio"
                    value="card"
                    disabled
                    class="w-4 h-4 text-black accent-black dark:accent-white"
                  >
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-black dark:text-white">{{ $t('checkout.order.creditCard') }}</span>
                    <span class="text-xs text-gray-500">({{ $t('checkout.order.comingSoon') }})</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="pt-8 flex" :class="locale === 'ar' ? 'justify-start' : 'justify-end'">
              <button
                :disabled="isSubmitting"
                class="bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black hover:dark:bg-gray-200 px-8 py-3 text-sm font-bold flex items-center gap-3 transition-colors uppercase disabled:opacity-50"
                @click="placeOrder"
              >
                <span v-if="isSubmitting">{{ $t('checkout.buttons.processing') }}</span>
                <span v-else>{{ $t('checkout.buttons.placeOrder') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Order Summary -->
        <div class="lg:col-span-5">
          <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <!-- Header -->
            <div class="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-shopping-bag" class="w-5 h-5 text-gray-500" />
                  {{ $t('checkout.order.yourOrder') }}
                </h2>
                <span class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  {{ lines.reduce((acc, i) => acc + i.quantity, 0) }} {{ locale === 'ar' ? 'منتجات' : 'items' }}
                </span>
              </div>
            </div>

            <!-- Cart Items - Premium Design -->
            <div class="p-4 max-h-[450px] overflow-y-auto">
              <div class="space-y-4">
                <div
                  v-for="item in lines"
                  :key="item.productId"
                  class="group bg-gray-50 dark:bg-gray-800 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div class="flex gap-4">
                    <!-- Product Image - Larger -->
                    <div class="relative flex-shrink-0">
                      <NuxtLink
                        :to="`/products/${item.slug}`"
                        target="_blank"
                        class="block"
                      >
                        <div class="w-24 h-28 bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm group-hover:shadow-md transition-shadow">
                          <img
                            :src="item.image || '/placeholder.png'"
                            :alt="item.title"
                            class="w-full h-full object-cover"
                          >
                        </div>
                      </NuxtLink>
                      <!-- Quantity Badge -->
                      <span class="absolute -top-2 -right-2 min-w-[26px] h-[26px] bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg">
                        {{ item.quantity }}
                      </span>
                    </div>

                    <!-- Product Info -->
                    <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <h3 class="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {{ item.title }}
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ formatPrice(item.price) }} × {{ item.quantity }}
                        </p>
                      </div>

                      <div class="flex items-center justify-between mt-2">
                        <p class="text-base font-bold text-gray-900 dark:text-white">
                          {{ formatPrice(item.price * item.quantity) }}
                        </p>

                        <!-- Action Links -->
                        <div class="flex items-center gap-3">
                          <NuxtLink
                            :to="`/products/${item.slug}`"
                            target="_blank"
                            class="text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                          >
                            <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
                            {{ locale === 'ar' ? 'عرض' : 'View' }}
                          </NuxtLink>
                          <button
                            class="text-xs font-medium text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                            @click="router.push('/cart')"
                          >
                            <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" />
                            {{ locale === 'ar' ? 'تعديل' : 'Edit' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Promo Code Section -->
            <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div v-if="appliedPromo" class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium p-3 rounded-lg">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-ticket" class="w-4 h-4" />
                  <span>{{ appliedPromo.code }}</span>
                  <span class="text-green-600 dark:text-green-500 font-bold">-{{ formatPrice(promoDiscount) }}</span>
                </div>
                <button class="text-red-500 hover:text-red-600 text-xs font-bold" @click="removePromoCode">
                  <UIcon name="i-lucide-x" class="w-4 h-4" />
                </button>
              </div>
              <div v-else class="flex gap-2">
                <div class="flex-1 relative">
                  <UIcon name="i-lucide-ticket" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    v-model="promoCode"
                    type="text"
                    :placeholder="locale === 'ar' ? 'أدخل كود الخصم' : 'Enter promo code'"
                    class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  >
                </div>
                <button
                  :disabled="promoLoading || !promoCode"
                  class="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold uppercase rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="applyPromoCode"
                >
                  <span v-if="promoLoading">
                    <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                  </span>
                  <span v-else>{{ locale === 'ar' ? 'تطبيق' : 'Apply' }}</span>
                </button>
              </div>
              <p v-if="promoError" class="mt-2 text-xs text-red-500 flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                {{ promoError }}
              </p>
            </div>

            <!-- Summary Lines -->
            <div class="px-6 py-4 space-y-3 border-t border-gray-100 dark:border-gray-800">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{{ $t('checkout.order.subtotal') }}</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ formatPrice(subtotal) }}</span>
              </div>

              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <UIcon name="i-lucide-truck" class="w-4 h-4" />
                  {{ $t('checkout.order.shipping') }}
                </span>
                <span v-if="currentStep === 'INFORMATION'" class="text-xs text-gray-400 italic">
                  {{ $t('checkout.order.shippingCalc') }}
                </span>
                <span v-else class="font-semibold text-gray-900 dark:text-white">{{ formatPrice(shipping) }}</span>
              </div>

              <div v-if="bulkDiscount > 0" class="flex justify-between text-sm text-green-600">
                <span class="flex items-center gap-1">
                  <UIcon name="i-lucide-percent" class="w-4 h-4" />
                  {{ $t('checkout.order.bulkDiscount') }}
                </span>
                <span class="font-semibold">-{{ formatPrice(bulkDiscount) }}</span>
              </div>

              <div v-if="promoDiscount > 0" class="flex justify-between text-sm text-green-600">
                <span class="flex items-center gap-1">
                  <UIcon name="i-lucide-tag" class="w-4 h-4" />
                  {{ $t('checkout.order.discount') }}
                </span>
                <span class="font-semibold">-{{ formatPrice(promoDiscount) }}</span>
              </div>
            </div>

            <!-- Total -->
            <div class="px-6 py-5 bg-gray-900 dark:bg-gray-950">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-300">{{ $t('checkout.order.total') }}</span>
                <span class="text-2xl font-bold text-white">{{ formatPrice(total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom select arrow removal for cross-browser */
select {
  background-image: none;
}

/* Line clamp for product titles */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
