// @ts-nocheck
<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'

definePageMeta({
  layout: 'storefront'
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

const toast = useToast()
const { lines, subtotal, clear: clearCart } = useCart()

const form = reactive({
  name: '',
  phone: '',
  governorate: '',
  address: '',
  notes: '',
  payment: 'cod'
})

// Pricing state
const pricingSettings = ref<PricingSettings | null>(null)
const pricingLoading = ref(true)

// Promo code state
const promoCode = ref('')
const promoLoading = ref(false)
const appliedPromo = ref<PromoValidation | null>(null)
const promoError = ref('')

// Fetch pricing settings on mount
onMounted(async () => {
  try {
    pricingSettings.value = await $fetch<PricingSettings>('/api/public/pricing')
  } catch {
    // Use defaults if fetch fails
    pricingSettings.value = {
      shippingFee: 50,
      minOrderValue: 0,
      maxOrderValue: null,
      bulkDiscountThreshold: null,
      bulkDiscountPercentage: null,
      currency: 'EGP'
    }
  } finally {
    pricingLoading.value = false
  }
})

// Calculate shipping (from settings)
const shipping = computed(() => pricingSettings.value?.shippingFee ?? 50)

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

const formatPrice = (value: number) => `${value.toLocaleString('ar-EG')} ج.م`

// Apply promo code
const applyPromoCode = async () => {
  if (!promoCode.value.trim()) {
    promoError.value = 'أدخل كود الخصم'
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
      title: 'تم تطبيق الكود',
      description: result.message,
      color: 'success'
    })
  } catch (error: unknown) {
    const dataMessage = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    promoError.value = typeof dataMessage === 'string' ? dataMessage : 'كود غير صحيح'
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

const placeOrder = async () => {
  if (!form.name || !form.phone || !form.address) {
    toast.add({
      title: 'اكمل البيانات',
      description: 'الاسم، الهاتف والعنوان مطلوبة لإتمام الطلب',
      color: 'warning'
    })
    return
  }

  if (lines.value.length === 0) {
    toast.add({
      title: 'السلة فارغة',
      description: 'أضف منتجات للسلة قبل إتمام الطلب',
      color: 'warning'
    })
    return
  }

  if (belowMinOrder.value) {
    toast.add({
      title: 'الحد الأدنى للطلب',
      description: `الحد الأدنى للطلب هو ${formatPrice(pricingSettings.value?.minOrderValue ?? 0)}`,
      color: 'warning'
    })
    return
  }

  if (aboveMaxOrder.value) {
    toast.add({
      title: 'الحد الأقصى للطلب',
      description: `الحد الأقصى للطلب هو ${formatPrice(pricingSettings.value?.maxOrderValue ?? 0)}`,
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true
  try {
    const response = await $fetch('/api/public/orders', {
      method: 'POST',
      body: {
        customer: {
          name: form.name,
          phone: form.phone,
          governorate: form.governorate,
          address: form.address,
          notes: form.notes
        },
        paymentMethod: form.payment,
        items: lines.value,
        promoCode: appliedPromo.value?.code ?? null
      }
    })

    orderNumber.value = response.orderNumber
    orderComplete.value = true
    await clearCart()

    toast.add({
      title: 'تم إنشاء الطلب بنجاح',
      description: response.message,
      color: 'success'
    })
  } catch (error: unknown) {
    const dataMessage = (error as { data?: { message?: string } })?.data?.message
    const message = typeof dataMessage === 'string'
      ? dataMessage
      : error instanceof Error
        ? error.message
        : 'حاول مرة أخرى أو تواصل معنا عبر واتساب'

    toast.add({
      title: 'تعذر إنشاء الطلب',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-12 space-y-8">
    <!-- Order Success State -->
    <div v-if="orderComplete" class="max-w-lg mx-auto text-center space-y-6">
      <div class="size-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <UIcon name="i-lucide-check" class="size-10 text-green-600 dark:text-green-400" />
      </div>
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          تم إنشاء الطلب بنجاح!
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          رقم الطلب: <span class="font-mono font-semibold">{{ orderNumber }}</span>
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          سنتواصل معك قريباً لتأكيد الشحن والدفع عند الاستلام.
        </p>
      </div>
      <div class="flex justify-center gap-3">
        <UButton to="/" color="primary" icon="i-lucide-home">
          العودة للرئيسية
        </UButton>
        <UButton to="/products" variant="soft" icon="i-lucide-shopping-bag">
          تصفح المنتجات
        </UButton>
      </div>
    </div>

    <!-- Checkout Form -->
    <template v-else>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          إتمام الطلب
        </h1>
        <ULink to="/cart" class="text-primary">العودة للسلة</ULink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <UCard class="space-y-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div class="space-y-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              بيانات العميل
            </p>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              معلومات الشحن
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UInput v-model="form.name" placeholder="الاسم الكامل" />
            <UInput v-model="form.phone" placeholder="رقم الهاتف" />
            <UInput v-model="form.governorate" placeholder="المحافظة" />
            <UInput v-model="form.address" class="md:col-span-2" placeholder="العنوان بالتفصيل" />
            <UTextarea v-model="form.notes" class="md:col-span-2" placeholder="ملاحظات إضافية (اختياري)" />
          </div>

          <div class="space-y-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              طريقة الدفع
            </p>
            <URadioGroup
              v-model="form.payment"
              :options="[
                { label: 'الدفع عند الاستلام', value: 'cod' },
                { label: 'بطاقة عبر Paymob', value: 'paymob' }
              ]"
            />
          </div>

          <div class="flex justify-end">
            <UButton
              color="primary"
              size="lg"
              icon="i-lucide-check-circle-2"
              :loading="isSubmitting"
              :disabled="!lines.length"
              @click="placeOrder"
            >
              إتمام الشراء
            </UButton>
          </div>
        </UCard>

        <UCard class="h-fit space-y-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ملخص الطلب
          </h2>

          <div v-if="!lines.length" class="text-gray-500 dark:text-gray-400 text-sm">
            لا توجد منتجات في السلة.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in lines"
              :key="`${item.productId}-${item.variantId || 'default'}`"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="item.image || 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=200'"
                  :alt="item.title"
                  class="size-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700"
                  loading="lazy"
                >
                <div class="space-y-1">
                  <p class="font-medium text-gray-900 dark:text-gray-100">
                    {{ item.title }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    x{{ item.quantity }}
                  </p>
                </div>
              </div>
              <p class="font-semibold text-primary">
                {{ formatPrice(item.price * item.quantity) }}
              </p>
            </div>

            <UDivider />

            <!-- Promo Code Section -->
            <div class="space-y-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                كود الخصم
              </p>
              <div v-if="appliedPromo" class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-ticket-check" class="size-5 text-green-600" />
                  <span class="font-mono font-semibold text-green-700 dark:text-green-400">{{ appliedPromo.code }}</span>
                </div>
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="removePromoCode"
                />
              </div>
              <div v-else class="flex gap-2">
                <UInput
                  v-model="promoCode"
                  placeholder="أدخل الكود"
                  class="flex-1 uppercase"
                  :disabled="promoLoading"
                  @keyup.enter="applyPromoCode"
                />
                <UButton
                  label="تطبيق"
                  :loading="promoLoading"
                  @click="applyPromoCode"
                />
              </div>
              <p v-if="promoError" class="text-xs text-red-500">
                {{ promoError }}
              </p>
            </div>

            <UDivider />

            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>الإجمالي</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>

            <!-- Show bulk discount if applicable -->
            <div v-if="bulkDiscount > 0" class="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>خصم الكمية ({{ pricingSettings?.bulkDiscountPercentage }}%)</span>
              <span>- {{ formatPrice(bulkDiscount) }}</span>
            </div>

            <!-- Show promo discount if applicable -->
            <div v-if="promoDiscount > 0" class="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>خصم الكود</span>
              <span>- {{ formatPrice(promoDiscount) }}</span>
            </div>

            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>الشحن</span>
              <span>{{ formatPrice(shipping) }}</span>
            </div>

            <!-- Min order warning -->
            <div v-if="belowMinOrder" class="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs text-yellow-700 dark:text-yellow-400">
              <UIcon name="i-lucide-alert-triangle" class="inline size-4" />
              الحد الأدنى للطلب: {{ formatPrice(pricingSettings?.minOrderValue ?? 0) }}
            </div>

            <UDivider />
            <div class="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100">
              <span>الإجمالي الكلي</span>
              <span class="text-primary">{{ formatPrice(total) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
