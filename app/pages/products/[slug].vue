<script setup lang="ts">
import { computed, ref, watch } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { add: addToCart } = useCart()
const { items: wishlistItems, add: addToWishlist, remove: removeFromWishlist } = useWishlist()

type ProductDetail = {
  id: number
  name: string
  price: number
  salePrice?: number | null
  description?: string | null
  shortDescription?: string | null
  images?: string[]
  brand?: { name?: string | null } | null
  category?: { name?: string | null, slug?: string | null } | null
  status?: string
}

const { data: productData, pending, error } = await useFetch<ProductDetail>(`/api/public/products/${route.params.slug}`)

const product = computed(() => productData.value ?? null)
const images = computed(() => (product.value?.images?.length
  ? product.value.images
  : [
      'https://placehold.co/1200x1500/f3f4f6/171717?text=Product'
    ]))
const activeImage = ref('')

watch(images, (list) => {
  activeImage.value = list[0] ?? ''
}, { immediate: true })

const quantity = ref(1)

const displayPrice = computed(() => product.value?.salePrice ?? product.value?.price ?? 0)
const hasSale = computed(() =>
  typeof product.value?.salePrice === 'number'
  && typeof product.value?.price === 'number'
  && product.value.salePrice < product.value.price
)

const discountPercent = computed(() => {
  if (!hasSale.value || !product.value?.price || !product.value?.salePrice) return null
  return Math.round(((product.value.price - product.value.salePrice) / product.value.price) * 100)
})

const availabilityLabel = computed(() => {
  const status = product.value?.status
  if (status === 'out_of_stock') return 'غير متوفر'
  if (status === 'low_stock') return 'كمية محدودة'
  return 'متوفر'
})

const isInWishlist = computed(() => {
  const id = product.value?.id
  if (!id) return false
  return wishlistItems.value.some(item => item.productId === id)
})

const toggleWishlist = async () => {
  if (!product.value) return
  if (isInWishlist.value) {
    await removeFromWishlist(product.value.id, undefined)
  } else {
    await addToWishlist({
      title: product.value.name,
      price: product.value.price,
      image: product.value.images?.[0],
      productId: product.value.id
    })
  }
}

const handleAddToCart = async (redirect = false) => {
  if (!product.value) return
  try {
    await addToCart({
      title: product.value.name,
      price: displayPrice.value,
      quantity: quantity.value,
      image: product.value.images?.[0],
      productId: product.value.id
    })

    toast.add({
      title: 'تمت الإضافة إلى السلة',
      description: product.value.name,
      color: 'success'
    })

    if (redirect) {
      router.push('/checkout')
    }
  } catch (error: any) {
    toast.add({
      title: 'تعذر الإضافة للسلة',
      description: error?.data?.message || error?.message || 'حاول مرة أخرى',
      color: 'error'
    })
  }
}

const orderForm = ref({
  name: '',
  phone: '',
  governorate: '',
  address: '',
  notes: ''
})

const isSubmitting = ref(false)
const orderComplete = ref(false)
const orderNumber = ref('')

const placeOrder = async () => {
  if (!product.value) return

  if (!orderForm.value.name || !orderForm.value.phone || !orderForm.value.address) {
    toast.add({
      title: 'اكمل البيانات',
      description: 'الاسم، الهاتف والعنوان مطلوبة لإتمام الطلب',
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true
  try {
    const response = await $fetch<{ orderNumber: string, message: string }>('/api/public/orders', {
      method: 'POST',
      body: {
        customer: {
          name: orderForm.value.name,
          phone: orderForm.value.phone,
          governorate: orderForm.value.governorate,
          address: orderForm.value.address,
          notes: orderForm.value.notes
        },
        paymentMethod: 'cod',
        items: [
          {
            productId: product.value.id,
            variantId: undefined,
            title: product.value.name,
            price: displayPrice.value,
            quantity: quantity.value,
            image: product.value.images?.[0]
          }
        ]
      }
    })

    orderComplete.value = true
    orderNumber.value = response.orderNumber

    toast.add({
      title: 'تم إنشاء الطلب بنجاح',
      description: response.message,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'تعذر إنشاء الطلب',
      description: error?.data?.message || error?.message || 'حاول مرة أخرى',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

const formatPrice = (value: number) => `${value.toLocaleString('ar-EG')} ج.م`
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <main class="flex-grow pt-20 pb-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="pending" class="py-24 text-center text-neutral-500">
          جاري تحميل المنتج...
        </div>
        <div v-else-if="error" class="py-24 text-center text-red-600">
          {{ error?.message || 'تعذر تحميل المنتج' }}
        </div>
        <div v-else class="flex flex-col lg:flex-row gap-12 lg:gap-24">
          <!-- LEFT: Product Visuals -->
          <div class="lg:w-1/2">
            <div class="sticky top-24 space-y-4">
              <!-- Main Image -->
              <div class="aspect-[4/5] bg-gray-100 rounded-sm overflow-hidden relative group">
                <img :src="activeImage" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" :alt="product?.name || ''">
                <div v-if="hasSale" class="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  Sale
                </div>
              </div>

              <!-- Thumbnails -->
              <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  v-for="(img, idx) in images"
                  :key="idx"
                  class="w-24 aspect-[4/5] shrink-0 border-2 transition-all p-0.5"
                  :class="activeImage === img ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'"
                  @click="activeImage = img"
                >
                  <img :src="img" class="w-full h-full object-cover">
                </button>
              </div>
            </div>
          </div>

          <!-- RIGHT: Product Details & EXPRESS CHECKOUT -->
          <div class="lg:w-1/2">
            <div class="max-w-xl">
              <!-- Titles & Price -->
              <div class="mb-8 border-b border-neutral-200 pb-8">
                <p class="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  {{ product?.brand?.name || product?.category?.name || 'Brand' }}
                </p>
                <h1 class="text-4xl lg:text-5xl font-serif font-black uppercase leading-tight mb-4">
                  {{ product?.name }}
                </h1>

                <div class="flex items-center gap-4 mb-6">
                  <span class="text-3xl font-serif font-bold" :class="hasSale ? 'text-red-600' : 'text-neutral-900'">
                    {{ formatPrice(displayPrice) }}
                  </span>
                  <span v-if="hasSale" class="text-xl font-serif text-neutral-400 line-through">
                    {{ formatPrice(product?.price || 0) }}
                  </span>
                  <span v-if="discountPercent" class="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest ml-auto">
                    Save {{ discountPercent }}%
                  </span>
                </div>

                <!-- Social Proof / Urgency -->
                <div class="flex items-center justify-between bg-neutral-100 p-4 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">{{ availabilityLabel }}</span>
                  </div>
                  <div class="text-xs font-mono font-bold text-neutral-500">
                    {{ product?.shortDescription || 'توصيل سريع لكل المحافظات' }}
                  </div>
                </div>
              </div>

              <!-- Quantity + Actions -->
              <div class="mb-12 space-y-6">
                <p class="text-sm text-neutral-600">
                  {{ product?.description || 'تفاصيل إضافية عن المنتج ستظهر هنا.' }}
                </p>

                <div class="flex flex-wrap items-center gap-4">
                  <span class="text-xs font-bold uppercase tracking-widest">Quantity</span>
                  <div class="flex items-center border border-neutral-200 rounded-full h-10 w-32">
                    <button
                      type="button"
                      class="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-l-full"
                      @click="quantity = Math.max(1, quantity - 1)"
                    >
                      <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      :value="quantity"
                      readonly
                      class="w-12 text-center text-sm font-bold bg-transparent border-none p-0 focus:ring-0"
                    >
                    <button
                      type="button"
                      class="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-r-full"
                      @click="quantity = quantity + 1"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    class="bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition"
                    @click="handleAddToCart(false)"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    class="bg-white border border-neutral-300 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:border-amber-700 hover:text-amber-700 transition"
                    @click="handleAddToCart(true)"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    class="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-red-500 transition"
                    @click="toggleWishlist"
                  >
                    {{ isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist' }}
                  </button>
                </div>
              </div>

              <!-- DIRECT CHECKOUT FORM -->
              <div class="bg-white border-2 border-black p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500" />

                <h2 class="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                  <UIcon name="i-heroicons-bolt" class="w-6 h-6 text-yellow-500" />
                  Quick Checkout
                </h2>
                <div v-if="orderComplete" class="space-y-4 text-center">
                  <div class="size-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <UIcon name="i-heroicons-check" class="w-8 h-8 text-green-600" />
                  </div>
                  <p class="text-lg font-bold">
                    تم إنشاء الطلب بنجاح
                  </p>
                  <p class="text-sm text-neutral-500">
                    رقم الطلب: {{ orderNumber }}
                  </p>
                  <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <NuxtLink to="/" class="bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition">
                      العودة للرئيسية
                    </NuxtLink>
                    <NuxtLink to="/products" class="border border-neutral-300 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:border-amber-700 hover:text-amber-700 transition">
                      متابعة التسوق
                    </NuxtLink>
                  </div>
                </div>

                <form v-else class="space-y-4" @submit.prevent="placeOrder">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Full Name</label>
                      <input
                        v-model="orderForm.name"
                        type="text"
                        placeholder="John Doe"
                        class="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-black font-medium transition-colors"
                        required
                      >
                    </div>
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Phone Number</label>
                      <input
                        v-model="orderForm.phone"
                        type="tel"
                        placeholder="+20 100 000 0000"
                        class="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-black font-medium transition-colors"
                        required
                      >
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Governorate</label>
                      <input
                        v-model="orderForm.governorate"
                        type="text"
                        placeholder="Cairo"
                        class="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-black font-medium transition-colors"
                      >
                    </div>
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Delivery Address</label>
                      <input
                        v-model="orderForm.address"
                        type="text"
                        placeholder="Street Address, Apt, Suite"
                        class="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-black font-medium transition-colors"
                        required
                      >
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Notes</label>
                    <textarea
                      v-model="orderForm.notes"
                      rows="3"
                      placeholder="ملاحظات إضافية (اختياري)"
                      class="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-black font-medium transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    class="w-full bg-black text-white py-5 text-sm font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-lg mt-6 flex items-center justify-center gap-2 group"
                    :disabled="isSubmitting"
                  >
                    <span>Complete Order - {{ formatPrice(displayPrice * quantity) }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p class="text-[10px] text-center text-neutral-400 font-medium pt-2">
                    By placing this order you agree to our Terms of Service.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Description / Details (Below fold) -->
        <div class="mt-24 max-w-4xl mx-auto border-t border-neutral-200 pt-16">
          <h3 class="text-2xl font-serif font-black uppercase mb-8 text-center">
            Product Details
          </h3>
          <p class="text-lg text-neutral-600 leading-relaxed text-center font-light">
            {{ product.description }}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <UIcon name="i-heroicons-truck" class="w-8 h-8 mx-auto mb-4" />
              <h4 class="font-bold uppercase tracking-widest text-xs mb-2">
                Free Delivery
              </h4>
              <p class="text-xs text-neutral-500">
                On all orders over $200
              </p>
            </div>
            <div>
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-4" />
              <h4 class="font-bold uppercase tracking-widest text-xs mb-2">
                30 Days Return
              </h4>
              <p class="text-xs text-neutral-500">
                Hassle-free return policy
              </p>
            </div>
            <div>
              <UIcon name="i-heroicons-shield-check" class="w-8 h-8 mx-auto mb-4" />
              <h4 class="font-bold uppercase tracking-widest text-xs mb-2">
                Authenticity
              </h4>
              <p class="text-xs text-neutral-500">
                100% Original Products
              </p>
            </div>
          </div>
        </div>

        <!-- Product Reviews Section -->
        <div v-if="product" class="mt-16 max-w-4xl mx-auto border-t border-neutral-200 pt-8">
          <ProductsProductReviews :product-id="product.id" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Utility for hiding scrollbar but allowing scroll */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
