// @ts-nocheck
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

definePageMeta({
  layout: 'storefront'
})

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

const shipping = ref(80)
const total = computed(() => subtotal.value + shipping.value)
const isSubmitting = ref(false)
const orderComplete = ref(false)
const orderNumber = ref('')

const formatPrice = (value: number) => `${value.toLocaleString('ar-EG')} ج.م`

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
        items: lines.value
      }
    })

    orderNumber.value = response.orderNumber
    orderComplete.value = true
    clearCart()

    toast.add({
      title: 'تم إنشاء الطلب بنجاح',
      description: response.message,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'تعذر إنشاء الطلب',
      description: error?.data?.message || error?.message || 'حاول مرة أخرى أو تواصل معنا عبر واتساب',
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

            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>الإجمالي</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>الشحن</span>
              <span>{{ formatPrice(shipping) }}</span>
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
