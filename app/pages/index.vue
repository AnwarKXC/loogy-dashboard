<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const fallbackHeroImage = 'https://placehold.co/1200x800/e5e5e5/171717?text=Hero'
const fallbackHeroImage2 = 'https://placehold.co/1200x800/1e293b/ffffff?text=Hero+Alt'
const fallbackCardImage = 'https://placehold.co/600x800/f3f4f6/171717?text=Product'
const fallbackCategoryImage = 'https://placehold.co/1200x900/e5e5e5/171717?text=Category'

// Availability type labels and configurations
const AVAILABILITY_CONFIG = {
  IN_STOCK_EGYPT: {
    label: 'In Stock',
    badge: 'Fast Shipping',
    badgeColor: 'bg-green-600',
    description: 'Ready to ship from Egypt (2-4 days)',
    icon: 'i-heroicons-truck'
  },
  ARRIVING_SOON: {
    label: 'Arriving Soon',
    badge: 'Coming Soon',
    badgeColor: 'bg-blue-600',
    description: 'In transit from KSA (1-2 weeks)',
    icon: 'i-heroicons-clock'
  },
  PRE_ORDER: {
    label: 'Pre-Order',
    badge: 'WhatsApp Only',
    badgeColor: 'bg-amber-600',
    description: 'Made to order - Contact via WhatsApp',
    icon: 'i-heroicons-phone'
  }
} as const

const BRAND_CARD_STYLES = [
  {
    bg: 'bg-neutral-900',
    accent: 'text-amber-500',
    blob: 'bg-amber-500',
    border: 'border-amber-500/20',
    shadow: 'shadow-amber-500/10'
  },
  {
    bg: 'bg-blue-900',
    accent: 'text-blue-400',
    blob: 'bg-blue-500',
    border: 'border-blue-400/20',
    shadow: 'shadow-blue-500/10'
  },
  {
    bg: 'bg-emerald-900',
    accent: 'text-emerald-400',
    blob: 'bg-emerald-500',
    border: 'border-emerald-400/20',
    shadow: 'shadow-emerald-500/10'
  },
  {
    bg: 'bg-rose-900',
    accent: 'text-rose-400',
    blob: 'bg-rose-500',
    border: 'border-rose-400/20',
    shadow: 'shadow-rose-500/10'
  }
]

type AvailabilityType = keyof typeof AVAILABILITY_CONFIG

type HomeProduct = {
  id: number
  name: string
  price: number
  salePrice?: number | null
  image?: string | null
  slug?: string
  category?: { name?: string | null, slug?: string | null } | null
  status?: string
  availabilityType?: AvailabilityType
}

type HomeBrand = {
  id: number
  name: string
  logo?: string | null
}

type HomeCategory = {
  id: number
  slug?: string
  title: string
  count: string
  image?: string | null
  colSpan?: string
}

type MainCategory = {
  slug: string
  name: string
  count: number
}

type HomeTestimonial = {
  id: number
  customerName: string | null
  content: string | null
  images: string[]
  source: string | null
  rating: number | null
  createdAt: string
}

type HomeTopBrand = {
  id: number
  slug: string
  name: string
  logo: string | null
  productCount: number
}

type HomeResponse = {
  hero?: {
    title?: string
    subtitle?: string
    ctaLabel?: string
    ctaTo?: string
    slides?: Array<Record<string, unknown>>
  }
  currency?: string
  sections?: {
    newArrivals?: HomeProduct[]
    collections?: HomeProduct[]
    egyptProducts?: HomeProduct[]
    previousOrders?: HomeProduct[]
    // Availability-based sections
    inStockEgypt?: HomeProduct[]
    arrivingSoon?: HomeProduct[]
    preOrder?: HomeProduct[]
    // Sale products
    saleProducts?: HomeProduct[]
    // Products by category
    byCategory?: Record<string, HomeProduct[]>
  }
  galleryImages?: string[]
  testimonials?: HomeTestimonial[]
  topBrands?: HomeTopBrand[]
  brands?: HomeBrand[]
  categories?: HomeCategory[]
  mainCategories?: MainCategory[]
}

const { data: homeData } = await useFetch('/api/public/storefront/home')
const router = useRouter()
const toast = useToast()
const { add: addToCart } = useCart()

const home = computed<HomeResponse>(() => (homeData.value ?? {}) as HomeResponse)

// SEO & Meta using Nuxt SEO
const pageTitle = computed(() => home.value?.hero?.title || 'Main Store - Shop the Best Products')
const pageDescription = computed(() => {
  const heroSubtitle = home.value?.hero?.subtitle
  // Ensure description is at least 120 characters for SEO
  if (heroSubtitle && heroSubtitle.length >= 50) {
    return heroSubtitle
  }
  return 'Shop the best products at competitive prices with high quality. Discover our wide range of clothing, shoes, and accessories. Fast shipping to all locations and cash on delivery.'
})

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
  description: pageDescription,
  ogDescription: pageDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  robots: 'index, follow'
})

// Dynamic OG Image for Homepage
defineOgImageComponent('Default', {
  title: pageTitle,
  description: pageDescription
})

// Schema.org using nuxt-schema-org
useSchemaOrg([
  defineWebSite({
    name: 'Loogy Store',
    description: () => pageDescription.value,
    inLanguage: ['ar', 'en']
  }),
  defineWebPage({
    '@type': 'CollectionPage',
    'name': () => pageTitle.value,
    'description': () => pageDescription.value
  }),
  // ItemList for featured products (Rich Results)
  defineItemList({
    itemListElement: computed(() =>
      (home.value.sections?.newArrivals ?? []).slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': `/products/${product.slug}`,
        'name': product.name,
        'image': product.image
      }))
    )
  })
])

const heroSlides = computed(() => {
  const hero = home.value.hero ?? {}
  const title = typeof hero.title === 'string' && hero.title.trim().length > 0 ? hero.title : 'NEW COLLECTION'
  const parts = title.split(' ')
  const title1 = parts[0] ?? 'NEW'
  const title2 = parts[1] ?? 'COLLE'
  const title3 = parts.slice(2).join(' ') || 'CTION'
  const slides = Array.isArray(hero.slides) && hero.slides.length > 0
    ? hero.slides
    : [{ image: '', image2: '' }]

  return slides.map((slide: Record<string, unknown>) => ({
    title: title1,
    title2,
    title3,
    subtitle: (slide.subtitle as string) || hero.subtitle || 'Seasonal drops',
    image: (slide.image as string) || fallbackHeroImage,
    image2: (slide.image2 as string) || (slide.image as string) || fallbackHeroImage2,
    cta: (slide.ctaLabel as string) || hero.ctaLabel || 'GO TO SHOP',
    to: (slide.ctaTo as string) || hero.ctaTo || '/products'
  }))
})

const heroCarouselRef = useTemplateRef('heroCarousel')
const activeSlideIndex = ref(0)

const onHeroSlideSelect = (index: number) => {
  activeSlideIndex.value = index
}

const goToPrevSlide = () => {
  heroCarouselRef.value?.emblaApi?.scrollPrev()
}

const goToNextSlide = () => {
  heroCarouselRef.value?.emblaApi?.scrollNext()
}

const searchTerm = ref('')
const handleSearch = () => {
  const value = searchTerm.value.trim()
  router.push({
    path: '/products',
    query: value ? { search: value } : undefined
  })
}

// Currency from settings
const currency = computed(() => home.value.currency ?? 'EGP')

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  EGP: 'EGP',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SAR',
  AED: 'AED'
}

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number') return ''
  const symbol = CURRENCY_SYMBOLS[currency.value] ?? currency.value
  return `${symbol} ${price.toFixed(2)}`
}

const newArrivals = computed(() =>
  ((home.value.sections?.newArrivals ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image ?? fallbackCardImage
  }))
)

const _collections = computed(() =>
  ((home.value.sections?.collections ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    cat: item.category?.name ?? 'Collection',
    image: item.image ?? fallbackCardImage
  }))
)

const galleryImages = computed(() => {
  const images = home.value.galleryImages?.length
    ? [...home.value.galleryImages]
    : newArrivals.value.map(item => item.image).filter(Boolean)

  while (images.length < 3) {
    images.push(fallbackCardImage)
  }

  return images.slice(0, 3)
})

const _brands = computed(() => home.value.brands ?? [])
const promotionalCategories = computed(() =>
  (home.value.categories ?? []).map(category => ({
    ...category,
    slug: category.slug,
    image: category.image ?? fallbackCategoryImage
  }))
)

// Testimonials for carousel (15 items from API)
const testimonials = computed(() => home.value.testimonials ?? [])

// Top 4 brands by product count
const topBrands = computed(() => home.value.topBrands ?? [])

// Source icons for testimonials
const sourceIcons: Record<string, string> = {
  facebook: 'i-simple-icons-facebook',
  whatsapp: 'i-simple-icons-whatsapp',
  instagram: 'i-simple-icons-instagram',
  google: 'i-simple-icons-google'
}

function renderStars(rating: number | null): string {
  if (!rating) return ''
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

// Image modal for testimonials
const selectedImage = ref<string | null>(null)
const isImageModalOpen = ref(false)

function openImage(img: string) {
  selectedImage.value = img
  isImageModalOpen.value = true
}

const _egyptProducts = computed(() =>
  ((home.value.sections?.egyptProducts ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image ?? fallbackCardImage
  }))
)

const _forSaleProducts = computed(() =>
  ((home.value.sections?.previousOrders ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    status: item.status ?? 'Available',
    image: item.image ?? fallbackCardImage
  }))
)

// Availability-based sections
const inStockEgyptProducts = computed(() =>
  ((home.value.sections?.inStockEgypt ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    salePrice: item.salePrice,
    availabilityType: item.availabilityType,
    image: item.image ?? fallbackCardImage
  }))
)

const arrivingSoonProducts = computed(() =>
  ((home.value.sections?.arrivingSoon ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    salePrice: item.salePrice,
    availabilityType: item.availabilityType,
    image: item.image ?? fallbackCardImage
  }))
)

const preOrderProducts = computed(() =>
  ((home.value.sections?.preOrder ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    salePrice: item.salePrice,
    availabilityType: item.availabilityType,
    image: item.image ?? fallbackCardImage
  }))
)

// Sale products with discount info
const saleProducts = computed(() =>
  ((home.value.sections?.saleProducts ?? []) as HomeProduct[]).map((item) => {
    const originalPrice = item.price
    const discountedPrice = item.salePrice ?? item.price
    const discountPercent = item.salePrice && item.price > 0
      ? Math.round(((item.price - item.salePrice) / item.price) * 100)
      : 0
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      price: discountedPrice,
      originalPrice,
      discountPercent,
      image: item.image ?? fallbackCardImage
    }
  })
)

// Products by main category
const productsByCategory = computed(() => home.value.sections?.byCategory ?? {})
const mainCategories = computed(() => home.value.mainCategories ?? [])

// Helper to get category products
const getCategoryProducts = (slug: string) => {
  const products = productsByCategory.value[slug] ?? []
  return products.map((item: HomeProduct) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    salePrice: item.salePrice,
    image: item.image ?? fallbackCardImage
  }))
}

// Category display config
const CATEGORY_CONFIG: Record<string, { icon: string, color: string, bgColor: string }> = {
  accessories: { icon: 'i-heroicons-gift', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  bags: { icon: 'i-heroicons-shopping-bag', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  shoes: { icon: 'i-heroicons-sparkles', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  watches: { icon: 'i-heroicons-clock', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  clothes: { icon: 'i-heroicons-user', color: 'text-rose-600', bgColor: 'bg-rose-50' }
}

const handleAddToCart = async (item: { id: number, name: string, price: number, image?: string }) => {
  try {
    await addToCart({
      title: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      productId: item.id
    })

    toast.add({
      title: 'Added to Cart',
      description: item.name,
      color: 'success'
    })
  } catch (error: unknown) {
    const dataMessage = (error as { data?: { message?: string } })?.data?.message
    const message = typeof dataMessage === 'string'
      ? dataMessage
      : error instanceof Error
        ? error.message
        : 'Please try again'

    toast.add({
      title: 'Failed to Add to Cart',
      description: message,
      color: 'error'
    })
  }
}

const brandsStatic = [
  { name: 'Nike', logo: 'i-simple-icons-nike' },
  { name: 'Adidas', logo: 'i-simple-icons-adidas' },
  { name: 'Puma', logo: 'i-simple-icons-puma' },
  { name: 'Reebok', logo: 'i-simple-icons-reebok' },
  { name: 'New Balance', logo: 'i-simple-icons-newbalance' },
  { name: 'Under Armour', logo: 'i-simple-icons-underarmour' },
  { name: 'Fila', logo: 'i-simple-icons-fila' },
  { name: 'Jordan', logo: 'i-simple-icons-jordan' },
  { name: 'The North Face', logo: 'i-simple-icons-thenorthface' },
  { name: 'Zara', logo: 'i-simple-icons-zara' },

  { name: 'Uniqlo', logo: 'i-simple-icons-uniqlo' },

  { name: 'Garmin', logo: 'i-simple-icons-garmin' }
]
// Remove static brands - we now use topBrands from API
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <!-- Main Content -->
    <main class="flex-grow pt-10">
      <!-- Hero Section -->
      <section class="relative bg-neutral-50 overflow-hidden min-h-[80dvh] flex flex-col justify-center">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
            <!-- Left: Text Content -->
            <div class="lg:col-span-5 relative z-20 pt-12 lg:pt-0 ">
              <div class="mb-20">
                <ul class="flex flex-col text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase gap-2 mb-8 pl-1">
                  <li class="group flex items-center gap-2">
                    <span class="w-0 h-px bg-amber-600 group-hover:w-6 transition-all duration-300" />
                    <NuxtLink to="/products?categorySlug=mens-fashion" class="text-neutral-900 hover:text-amber-600 transition-colors duration-300">
                      Men
                    </NuxtLink>
                  </li>
                  <li class="group flex items-center gap-2">
                    <span class="w-0 h-px bg-amber-600 group-hover:w-6 transition-all duration-300" />
                    <NuxtLink to="/products?categorySlug=womens-fashion" class="hover:text-amber-600 transition-colors duration-300">
                      Women
                    </NuxtLink>
                  </li>
                  <li class="group flex items-center gap-2">
                    <span class="w-0 h-px bg-amber-600 group-hover:w-6 transition-all duration-300" />
                    <NuxtLink to="/products?categorySlug=kids" class="hover:text-amber-600 transition-colors duration-300">
                      Kids
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <h1 class="text-8xl sm:text-9xl xl:text-[10rem] font-serif font-black uppercase leading-[0.85] tracking-tighter text-neutral-900 mb-6">
                <span>{{ heroSlides[activeSlideIndex]?.title }}</span><br>
                <span>{{ heroSlides[activeSlideIndex]?.title2 }}</span><br>
                <span>{{ heroSlides[activeSlideIndex]?.title3 }}</span>
              </h1>

              <p class="text-xl text-neutral-500 font-light mb-12 pl-2">
                {{ heroSlides[activeSlideIndex]?.subtitle }}
              </p>

              <!-- Search Input -->
              <form class="relative max-w-sm mb-12 bg-neutral-100/80 p-1 flex items-center" @submit.prevent="handleSearch">
                <button type="submit" class="h-full  hover:text-neutral-800 text-neutral-400 cursor-pointer duration-500 px-4">
                  <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 " />
                  <span class="sr-only">Search</span>
                </button>
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Search"
                  class="w-full bg-transparent border-none p-3 text-sm focus:ring-0 placeholder-neutral-400 focus:outline-none"
                  aria-label="Search products"
                >
              </form>

              <div class="flex items-center gap-6 pl-1">
                <NuxtLink
                  :to="heroSlides[activeSlideIndex]?.to || '/products'"
                  class="relative bg-neutral-900 text-white hover:bg-amber-600 transition-all duration-300 px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-4 group overflow-hidden"
                >
                  <span class="relative z-10">{{ heroSlides[activeSlideIndex]?.cta || 'Go to Shop' }}</span>
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <span class="absolute inset-0 bg-amber-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </NuxtLink>
                <div class="flex border border-neutral-300 bg-white/50 backdrop-blur-sm">
                  <button
                    type="button"
                    class="w-12 h-12 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-all duration-300"
                    aria-label="Previous slide"
                    @click="goToPrevSlide"
                  >
                    <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
                  </button>
                  <div class="w-px bg-neutral-200" />
                  <button
                    type="button"
                    class="w-12 h-12 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-all duration-300"
                    aria-label="Next slide"
                    @click="goToNextSlide"
                  >
                    <UIcon name="i-heroicons-chevron-right" class="w-5 h-5" />
                  </button>
                </div>
                <!-- Slide Indicators -->
                <div class="flex gap-3 ml-4">
                  <button
                    v-for="(_, idx) in heroSlides"
                    :key="idx"
                    type="button"
                    class="group/dot relative h-3 transition-all duration-300"
                    :class="activeSlideIndex === idx ? 'w-8' : 'w-3'"
                    :aria-label="`Go to slide ${idx + 1}`"
                    @click="heroCarouselRef?.emblaApi?.scrollTo(idx)"
                  >
                    <span
                      class="absolute inset-0 rounded-full transition-all duration-300"
                      :class="activeSlideIndex === idx ? 'bg-amber-600' : 'bg-neutral-300 group-hover/dot:bg-neutral-500'"
                    />
                  </button>
                </div>
              </div>
            </div>

            <!-- Right: Simple 2-Image Slider -->
            <div class="lg:col-span-7 relative h-[60vh] lg:h-[85vh] w-full">
              <UCarousel
                ref="heroCarousel"
                v-slot="{ item }: { item: { title: string, title2: string, title3: string, subtitle: string, image: string, image2: string, cta: string, to: string } }"
                :items="heroSlides"
                :ui="{
                  item: 'basis-full',
                  container: 'snap-x snap-mandatory h-full',
                  arrows: 'hidden'
                }"
                :autoplay="{ delay: 6000, stopOnInteraction: false }"
                loop
                class="h-full"
                @select="onHeroSlideSelect"
              >
                <NuxtLink :to="item.to" class="grid grid-cols-2 gap-4 h-full group/hero">
                  <!-- First Image -->
                  <div class="relative h-full bg-neutral-200 overflow-hidden rounded-lg">
                    <img
                      :src="item.image"
                      class="w-full h-full object-cover object-center transition-transform duration-700 group-hover/hero:scale-105"
                      alt="Collection Image 1"
                    >
                    <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500" />
                  </div>

                  <!-- Second Image -->
                  <div class="relative h-full bg-neutral-200 overflow-hidden rounded-lg">
                    <img
                      :src="item.image2"
                      class="w-full h-full object-cover object-center transition-transform duration-700 group-hover/hero:scale-105"
                      alt="Collection Image 2"
                    >
                    <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500" />
                  </div>
                </NuxtLink>
              </UCarousel>
            </div>
          </div>
        </div>
      </section>

      <!-- Brands Marquee (Seamless) -->
      <section class="overflow-hidden bg-white py-8 border-y border-neutral-100 mt-20">
        <div class="relative w-full max-w-full overflow-hidden flex">
          <div class="flex animate-marquee">
            <!-- Original Set -->
            <div class="flex gap-24 pr-24 items-center shrink-0">
              <UIcon
                v-for="(brand, idx) in brandsStatic"
                :key="'loop-1-' + idx"
                :name="brand.logo"
                class="w-16 h-16 text-neutral-300 hover:text-neutral-900 transition-colors duration-300"
              />
            </div>
            <div class="flex gap-24 pr-24 items-center shrink-0">
              <UIcon
                v-for="(brand, idx) in brandsStatic"
                :key="'loop-2-' + idx"
                :name="brand.logo"
                class="w-16 h-16 text-neutral-300 hover:text-neutral-900 transition-colors duration-300"
              />
            </div>
          </div>
          <!-- Fades -->
          <div class="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div class="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div class="hidden">
            <!-- Duplicate Set -->
            <!-- <div class="flex gap-24 pr-24 whitespace-nowrap items-center shrink-0">
              <NuxtLink
                v-for="(brand, idx) in brands"
                :key="'dup-'+idx"
                to="/products"
                class="flex items-center justify-center text-neutral-400 hover:text-black transition-all duration-300 cursor-pointer hover:scale-110"
              >
                <img
                  v-if="brand.logo"
                  :src="brand.logo"
                  :alt="brand.name"
                  class="h-12 sm:h-16 w-auto object-contain"
                  loading="lazy"
                >
                <span v-else class="text-xs font-bold uppercase tracking-widest">{{ brand.name }}</span>
              </NuxtLink>
            </div> -->
          </div>
        </div>
      </section>

      <!-- New This Week - Editorial Layout -->

      <!-- In Stock Egypt - Fast Shipping (2-4 days) -->
      <section v-if="inStockEgyptProducts.length > 0" class="py-24 bg-white relative overflow-hidden">
        <!-- Abstract Decoration -->
        <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-emerald-50/50 to-transparent rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2 opacity-60" />

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
          <div class="flex flex-col md:flex-row justify-between items-end gap-x-12 gap-y-8">
            <div class="max-w-2xl">
              <div class="flex items-center gap-4 mb-6">
                <div class="flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-900/10 bg-white/50 backdrop-blur-md">
                  <div class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </div>
                  <span class="text-emerald-900/70 text-[10px] font-black uppercase tracking-[0.2em]">{{ AVAILABILITY_CONFIG.IN_STOCK_EGYPT.badge }}</span>
                </div>
              </div>
              <h2 class="text-5xl lg:text-7xl font-serif font-medium text-neutral-900 leading-[0.9] tracking-tight mb-6">
                Ready to <span class="italic text-emerald-700">Ship</span>
              </h2>
              <p class="text-neutral-500 text-lg font-light leading-relaxed max-w-lg border-l-2 border-emerald-900/10 pl-6">
                {{ AVAILABILITY_CONFIG.IN_STOCK_EGYPT.description }}
              </p>
            </div>

            <NuxtLink
              to="/products?availability=IN_STOCK_EGYPT"
              class="group hidden md:flex flex-col gap-1"
            >
              <span class="text-xs font-black uppercase tracking-[0.2em] text-neutral-900 group-hover:text-emerald-700 transition-colors">View Collection</span>
              <span class="h-[1px] w-full bg-neutral-200 group-hover:bg-emerald-700 transition-colors duration-500 origin-left scale-x-100 group-hover:scale-x-50" />
            </NuxtLink>
          </div>
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <UCarousel
            v-slot="{ item }: { item: HomeProduct }"
            :items="inStockEgyptProducts"
            :ui="{
              item: 'basis-[80%] sm:basis-[45%] lg:basis-[24%] pr-6',
              container: 'snap-x snap-mandatory py-12',
              indicators: { wrapper: 'absolute bottom-0 inset-x-0 flex justify-center gap-3' }
            }"
            arrows
          >
            <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="group relative block outline-none ring-0">
              <!-- Image Container -->
              <div class="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 relative mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-500">
                <div class="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/5 transition-colors duration-500 z-10" />
                <img
                  :src="item.image || ''"
                  class="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  draggable="false"
                  :alt="item.name"
                >

                <!-- Floating Badge -->
                <div class="absolute top-3 left-3 z-20">
                  <span class="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    In Stock
                  </span>
                </div>

                <!-- Action Button -->
                <button
                  type="button"
                  class="absolute bottom-3 right-3 z-20 w-10 h-10 bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white rounded-full shadow-lg flex items-center justify-center transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  aria-label="Add to cart"
                  @click.stop.prevent="handleAddToCart(item)"
                >
                  <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="space-y-1.5 px-1">
                <div class="flex justify-between items-start gap-4">
                  <h3 class="font-sans text-sm font-semibold text-neutral-900 truncate flex-1 group-hover:text-emerald-700 transition-colors">
                    {{ item.name }}
                  </h3>
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-serif text-base font-bold text-neutral-900">{{ formatPrice(item.salePrice ?? item.price) }}</span>
                    <span v-if="item.salePrice" class="font-serif text-neutral-400 line-through text-xs">{{ formatPrice(item.price) }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80">
                    Ready to Ship
                  </p>
                </div>
              </div>
            </NuxtLink>
          </UCarousel>
        </div>
      </section>
      <!-- Sale Products Section -->
      <section v-if="saleProducts.length > 0" class="py-24 bg-neutral-950 relative overflow-hidden">
        <!-- Background Decorative Elements -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-neutral-950 to-black opacity-40 pointer-events-none" />
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-gradient-to-b from-red-900/10 to-transparent blur-3xl pointer-events-none" />

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="flex flex-col items-center mb-20">
            <span class="text-red-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Limited Time Offers</span>
            <h2 class="text-5xl lg:text-7xl font-serif font-black uppercase text-white tracking-tight mb-6">
              On Sale
            </h2>
            <div class="w-16 h-1 bg-red-600" />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-16">
            <div
              v-for="item in saleProducts"
              :key="item.id"
              class="group relative"
            >
              <!-- Card Body -->
              <div class="relative p-3 transition-all duration-500 group-hover:-translate-y-2">
                <!-- Background Frame -->
                <div class="absolute inset-0 bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-colors duration-500 rounded-lg" />

                <!-- Discount Badge -->
                <div v-if="item.discountPercent > 0" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 z-20 shadow-xl rounded-full">
                  -{{ item.discountPercent }}% OFF
                </div>

                <!-- Image Container -->
                <div class="aspect-[3/4] overflow-hidden relative w-full bg-neutral-900 rounded-lg">
                  <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="block h-full w-full">
                    <img
                      :src="item.image"
                      class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                      :alt="item.name"
                    >
                  </NuxtLink>

                  <!-- Hover Overlay -->
                  <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                    <button
                      type="button"
                      class="w-12 h-12 bg-red-600 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform scale-0 group-hover:scale-100 delay-100 rounded-full"
                      @click.stop.prevent="handleAddToCart({ ...item, price: item.price })"
                    >
                      <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5" />
                    </button>
                    <NuxtLink
                      :to="item.slug ? `/products/${item.slug}` : '/products'"
                      class="text-white text-[10px] font-bold uppercase tracking-widest hover:text-red-400 transition-colors transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 duration-300 delay-150"
                    >
                      View Product
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Product Info -->
              <div class="text-center mt-6 px-2">
                <h3 class="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors mb-3 line-clamp-1">
                  {{ item.name }}
                </h3>
                <div class="flex items-center justify-center gap-3">
                  <span class="font-serif text-lg text-red-500">{{ formatPrice(item.price) }}</span>
                  <span v-if="item.discountPercent > 0" class="font-serif text-sm text-neutral-500 line-through">{{ formatPrice(item.originalPrice) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-24 text-center">
            <NuxtLink to="/products?sale=true" class="group inline-flex items-center gap-4 text-white hover:text-red-500 transition-colors duration-300">
              <span class="text-xs font-bold uppercase tracking-[0.2em]">Explore All Sale Items</span>
              <UIcon name="i-heroicons-arrow-long-right" class="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Arriving Soon Section -->
      <section v-if="arrivingSoonProducts.length > 0" class="py-24 bg-neutral-50 relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute top-1/2 left-0 w-full h-[60%] bg-gradient-to-r from-blue-50/0 via-blue-100/30 to-blue-50/0 skew-y-6 pointer-events-none" />

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
          <div class="flex flex-col md:flex-row justify-between items-end gap-x-12 gap-y-8">
            <div class="max-w-2xl">
              <div class="flex items-center gap-4 mb-6">
                <div class="flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-900/10 bg-white/50 backdrop-blur-md">
                  <UIcon name="i-heroicons-clock" class="w-3 h-3 text-blue-600" />
                  <span class="text-blue-900/70 text-[10px] font-black uppercase tracking-[0.2em]">{{ AVAILABILITY_CONFIG.ARRIVING_SOON.badge }}</span>
                </div>
              </div>
              <h2 class="text-5xl lg:text-7xl font-serif font-medium text-neutral-900 leading-[0.9] tracking-tight mb-6">
                Arriving <span class="italic text-blue-700">Soon</span>
              </h2>
              <p class="text-neutral-500 text-lg font-light leading-relaxed max-w-lg border-l-2 border-blue-900/10 pl-6">
                {{ AVAILABILITY_CONFIG.ARRIVING_SOON.description }}
              </p>
            </div>

            <NuxtLink
              to="/products?availability=ARRIVING_SOON"
              class="group hidden md:flex flex-col gap-1"
            >
              <span class="text-xs font-black uppercase tracking-[0.2em] text-neutral-900 group-hover:text-blue-700 transition-colors">Pre-Book Collection</span>
              <span class="h-[1px] w-full bg-neutral-200 group-hover:bg-blue-700 transition-colors duration-500 origin-left scale-x-100 group-hover:scale-x-50" />
            </NuxtLink>
          </div>
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <UCarousel
            v-slot="{ item }: { item: HomeProduct }"
            :items="arrivingSoonProducts"
            :ui="{
              item: 'basis-[80%] sm:basis-[45%] lg:basis-[24%] pr-6',
              container: 'snap-x snap-mandatory py-12'
            }"
            arrows
          >
            <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="group relative block outline-none ring-0">
              <div class="aspect-[3/4] overflow-hidden bg-white relative mb-4 rounded-xl shadow-sm group-hover:shadow-lg transition-all duration-500">
                <div class="absolute top-3 left-3 z-20">
                  <span class="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Pre-Book
                  </span>
                </div>

                <img
                  :src="item.image || ''"
                  class="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  draggable="false"
                  :alt="item.name"
                >

                <!-- Action Strip -->
                <div class="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm py-3 px-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center border-t border-blue-100/50">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-blue-600">Secure Yours</span>
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-blue-600" />
                </div>
              </div>

              <!-- Product Info -->
              <div class="space-y-1.5 px-1">
                <div class="flex justify-between items-start gap-4">
                  <h3 class="font-sans text-sm font-semibold text-neutral-900 truncate flex-1 group-hover:text-blue-700 transition-colors">
                    {{ item.name }}
                  </h3>
                  <span class="font-serif text-base font-bold text-neutral-900 shrink-0">{{ formatPrice(item.salePrice ?? item.price) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" class="w-3 h-3 text-blue-500" />
                  <p class="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
                    In Transit
                  </p>
                </div>
              </div>
            </NuxtLink>
          </UCarousel>
        </div>
      </section>

      <!-- Pre-Order Section -->
      <section v-if="preOrderProducts.length > 0" class="py-24 bg-[#1c1c1c] relative overflow-hidden">
        <!-- Dark Luxe Texture -->
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-amber-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
          <div class="flex flex-col md:flex-row justify-between items-end gap-x-12 gap-y-8">
            <div class="max-w-2xl">
              <div class="flex items-center gap-4 mb-6">
                <div class="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 backdrop-blur-md">
                  <UIcon name="i-heroicons-sparkles" class="w-3 h-3 text-amber-500" />
                  <span class="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">{{ AVAILABILITY_CONFIG.PRE_ORDER.badge }}</span>
                </div>
              </div>
              <h2 class="text-5xl lg:text-7xl font-serif font-medium text-white leading-[0.9] tracking-tight mb-6">
                Exclusive <span class="italic text-amber-500">Order</span>
              </h2>
              <p class="text-neutral-400 text-lg font-light leading-relaxed max-w-lg border-l-2 border-amber-500/20 pl-6">
                {{ AVAILABILITY_CONFIG.PRE_ORDER.description }}
              </p>
            </div>
            <NuxtLink
              to="/products?availability=PRE_ORDER"
              class="group hidden md:flex flex-col gap-1"
            >
              <span class="text-xs font-black uppercase tracking-[0.2em] text-white group-hover:text-amber-500 transition-colors">Explore Catalog</span>
              <span class="h-[1px] w-full bg-neutral-800 group-hover:bg-amber-500 transition-colors duration-500 origin-left scale-x-100 group-hover:scale-x-50" />
            </NuxtLink>
          </div>
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <UCarousel
            v-slot="{ item }: { item: HomeProduct }"
            :items="preOrderProducts"
            :ui="{
              item: 'basis-[80%] sm:basis-[45%] lg:basis-[24%] pr-6',
              container: 'snap-x snap-mandatory py-12'
            }"
            arrows
          >
            <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="group relative block outline-none ring-0">
              <div class="aspect-[3/4] overflow-hidden bg-neutral-900 relative mb-4 rounded-xl border border-white/5 transition-colors duration-500 group-hover:border-amber-500/50">
                <!-- Badge -->
                <div class="absolute top-3 left-3 z-20">
                  <span class="bg-amber-500/90 backdrop-blur-sm text-neutral-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Pre-Order
                  </span>
                </div>

                <img
                  :src="item.image || ''"
                  class="w-full h-full object-cover opacity-80 transition-all duration-[1.5s] ease-out group-hover:scale-110 group-hover:opacity-100"
                  draggable="false"
                  :alt="item.name"
                >

                <!-- WhatsApp Badge -->
                <div class="absolute bottom-3 right-3 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  <a
                    :href="`https://wa.me/201000000000?text=I'm interested in pre-ordering: ${item.name}`"
                    target="_blank"
                    class="h-10 w-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-[#128C7E] shadow-lg hover:shadow-green-500/20"
                    @click.stop
                  >
                    <UIcon name="i-simple-icons-whatsapp" class="w-5 h-5" />
                  </a>
                </div>
              </div>

              <!-- Product Info -->
              <div class="space-y-1.5 px-1">
                <div class="flex justify-between items-start gap-4">
                  <h3 class="font-sans text-sm font-semibold tracking-wide text-neutral-300 group-hover:text-amber-500 transition-colors truncate flex-1">
                    {{ item.name }}
                  </h3>
                  <span class="font-serif text-base font-bold text-white shrink-0">{{ formatPrice(item.salePrice ?? item.price) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-sparkles" class="w-3 h-3 text-amber-500" />
                  <p class="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">
                    Made to Order
                  </p>
                </div>
              </div>
            </NuxtLink>
          </UCarousel>
        </div>
      </section>

      <!-- Shop By Category - Main Categories -->
      <section v-if="mainCategories.length > 0" class="py-24 bg-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="text-neutral-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Browse Our Categories</span>
            <h2 class="text-5xl lg:text-6xl font-serif font-black uppercase tracking-tight">
              Shop By Category
            </h2>
          </div>

          <!-- Category Tabs/Sections -->
          <div class="space-y-20">
            <template v-for="category in mainCategories" :key="category.slug">
              <div v-if="getCategoryProducts(category.slug).length > 0" class="relative">
                <!-- Category Header -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-14 h-14 rounded-2xl flex items-center justify-center"
                      :class="CATEGORY_CONFIG[category.slug]?.bgColor || 'bg-neutral-100'"
                    >
                      <UIcon
                        :name="CATEGORY_CONFIG[category.slug]?.icon || 'i-heroicons-squares-2x2'"
                        class="w-7 h-7"
                        :class="CATEGORY_CONFIG[category.slug]?.color || 'text-neutral-600'"
                      />
                    </div>
                    <div>
                      <h3 class="text-3xl font-serif font-bold capitalize">
                        {{ category.name }}
                      </h3>
                      <p class="text-neutral-500 text-sm">
                        {{ category.count }} products available
                      </p>
                    </div>
                  </div>
                  <NuxtLink
                    :to="`/categories/${category.slug}`"
                    class="text-xs font-bold uppercase tracking-widest border-b-2 border-neutral-900 pb-1 hover:border-amber-600 hover:text-amber-600 transition flex items-center gap-2"
                  >
                    View All {{ category.name }}
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
                  </NuxtLink>
                </div>

                <!-- Products Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  <div
                    v-for="item in getCategoryProducts(category.slug).slice(0, 4)"
                    :key="item.id"
                    class="group"
                  >
                    <div class="relative bg-neutral-100 aspect-[3/4] mb-4 overflow-hidden rounded-xl">
                      <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="block h-full">
                        <img
                          :src="item.image"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          :alt="item.name"
                        >
                      </NuxtLink>
                      <!-- Quick Add Button -->
                      <button
                        type="button"
                        class="absolute bottom-3 right-3 w-10 h-10 bg-white/90 hover:bg-neutral-900 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                        aria-label="Add to cart"
                        @click.stop.prevent="handleAddToCart(item)"
                      >
                        <UIcon name="i-heroicons-plus" class="w-5 h-5" />
                      </button>
                      <!-- Sale Badge -->
                      <div v-if="item.salePrice" class="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Sale
                      </div>
                    </div>
                    <div class="space-y-1">
                      <NuxtLink
                        :to="item.slug ? `/products/${item.slug}` : '/products'"
                        class="text-sm font-bold uppercase tracking-wide leading-relaxed group-hover:text-neutral-600 transition line-clamp-1"
                      >
                        {{ item.name }}
                      </NuxtLink>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-serif font-medium">{{ formatPrice(item.salePrice ?? item.price) }}</span>
                        <span v-if="item.salePrice" class="text-xs font-serif text-neutral-400 line-through">{{ formatPrice(item.price) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Decorative line between categories -->
                <div class="mt-16 border-b border-neutral-200" />
              </div>
            </template>
          </div>
        </div>
      </section>
      <!-- Top Brands Gallery Grid -->
      <section class="bg-white pt-24 pb-24 border-t border-gray-100">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <span class="text-neutral-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 block">
              Most Popular
            </span>
            <h2 class="text-4xl font-serif font-black uppercase">
              Top Brands
            </h2>
          </div>

          <div v-if="topBrands.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[500px]">
            <NuxtLink
              v-for="(brand, index) in topBrands.slice(0, 4)"
              :key="brand.slug"
              :to="`/products?brand=${brand.slug}`"
              class="group relative h-96 lg:h-full overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              :class="[
                BRAND_CARD_STYLES[index]?.bg || 'bg-neutral-900',
                index % 2 !== 0 ? 'lg:mt-12' : '',
                BRAND_CARD_STYLES[index]?.shadow || 'shadow-neutral-500/10'
              ]"
            >
              <!-- Background Pattern/Image -->
              <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />

              <!-- Parallax Gradient Blob -->
              <div
                class="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-700 ease-in-out"
                :class="BRAND_CARD_STYLES[index]?.blob || 'bg-neutral-500'"
              />

              <!-- Glass Content Container -->
              <div
                class="absolute inset-0 m-1 flex flex-col justify-between rounded-xl bg-white/5 p-6 backdrop-blur-sm border transition-all duration-300 group-hover:bg-white/10"
                :class="BRAND_CARD_STYLES[index]?.border || 'border-white/10'"
              >
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div
                    class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"
                    :class="BRAND_CARD_STYLES[index]?.accent || 'text-white'"
                  >
                    #{{ index + 1 }} Brand
                  </div>

                  <!-- Logo Badge -->
                  <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <img
                      v-if="brand.logo"
                      :src="brand.logo"
                      class="h-10 w-10 object-contain"
                      :alt="brand.name"
                    >
                    <span v-else class="text-xl font-black text-neutral-900">{{ brand.name.charAt(0) }}</span>
                  </div>
                </div>

                <!-- Center Content with Shine -->
                <div class="relative z-10 my-auto">
                  <!-- Reflection/Shine Line -->
                  <div class="absolute -inset-x-full top-0 block h-[1px] w-1/2 -rotate-45 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                </div>

                <!-- Footer -->
                <div>
                  <h3 class="mb-2 text-3xl font-black uppercase leading-none text-white transition-all duration-300 group-hover:tracking-wider">
                    {{ brand.name }}
                  </h3>

                  <div class="flex items-center justify-between border-t border-white/10 pt-4">
                    <p class="text-sm font-medium text-white/80">
                      {{ brand.productCount }} Products
                    </p>
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white/20"
                    >
                      <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Fallback if no brands -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[500px]">
            <div class="relative h-80 lg:h-full bg-gray-200 flex items-center justify-center">
              <p class="text-neutral-400">
                No brands available
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Us (Minimal) -->
      <section class="py-40 relative bg-fixed bg-center bg-cover" style="background-image: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop');">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/60" />

        <div class="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <div class="mb-16">
            <UIcon name="i-heroicons-sparkles" class="w-12 h-12 text-white/90 mx-auto mb-6" />
            <h2 class="text-4xl font-serif font-light uppercase tracking-wide text-white">
              Our Approach
            </h2>
          </div>

          <p class="text-2xl md:text-4xl font-serif font-light leading-relaxed text-white/90">
            “at elegant vogue, we blend creativity with <span class="italic font-normal text-amber-500">craftsmanship</span> to create fashion that transcends trends. each design is meticulously crafted.”
          </p>

          <div class="grid grid-cols-3 gap-8 mt-24 pt-12 border-t border-white/20">
            <div class="flex flex-col items-center gap-4 text-white">
              <span class="text-3xl font-black">01</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/70">Quality</span>
            </div>
            <div class="flex flex-col items-center gap-4 text-white">
              <span class="text-3xl font-black">02</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/70">Ethics</span>
            </div>
            <div class="flex flex-col items-center gap-4 text-white">
              <span class="text-3xl font-black">03</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/70">Passion</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials Carousel Section -->
      <section v-if="testimonials.length > 0" class="py-24 bg-gradient-to-b from-neutral-100 to-white overflow-hidden">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="text-neutral-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">
              What Our Customers Say
            </span>
            <h2 class="text-5xl lg:text-6xl font-serif font-black uppercase tracking-tight">
              Customer Reviews
            </h2>
          </div>

          <!-- Testimonials Carousel -->
          <UCarousel
            v-slot="{ item }: { item: HomeTestimonial }"
            :items="testimonials"
            :ui="{
              item: 'basis-full sm:basis-1/2 lg:basis-1/3 px-3',
              container: 'snap-x snap-mandatory'
            }"
            arrows
          >
            <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
              <!-- Header with source icon -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                    <UIcon
                      v-if="item.source && sourceIcons[item.source]"
                      :name="sourceIcons[item.source]"
                      class="w-6 h-6"
                    />
                    <UIcon v-else name="i-lucide-user" class="w-6 h-6 text-neutral-400" />
                  </div>
                  <div>
                    <p class="font-bold text-sm">
                      {{ item.customerName || 'Customer' }}
                    </p>
                    <p v-if="item.source" class="text-xs text-neutral-500 capitalize">
                      via {{ item.source }}
                    </p>
                  </div>
                </div>
                <div v-if="item.rating" class="text-amber-500 text-sm">
                  {{ renderStars(item.rating) }}
                </div>
              </div>

              <!-- Text Content -->
              <p v-if="item.content" class="text-neutral-600 text-sm leading-relaxed mb-4 flex-grow line-clamp-4">
                "{{ item.content }}"
              </p>

              <!-- Images (Screenshots) -->
              <div v-if="item.images && item.images.length > 0" class="grid grid-cols-3 gap-2 mt-auto">
                <img
                  v-for="(img, i) in item.images.slice(0, 3)"
                  :key="i"
                  :src="img"
                  :alt="`Screenshot ${i + 1}`"
                  class="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  @click="openImage(img)"
                >
              </div>
            </div>
          </UCarousel>

          <!-- View All Testimonials Link -->
          <div class="flex justify-center mt-16">
            <NuxtLink to="/testimonials" class="group flex flex-col items-center gap-4">
              <span class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors">
                View All Testimonials
              </span>
              <div class="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 animate-bounce" />
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Image Modal -->
        <UModal v-model:open="isImageModalOpen">
          <template #content>
            <div class="p-2">
              <img
                v-if="selectedImage"
                :src="selectedImage"
                alt="Screenshot"
                class="max-w-full max-h-[80vh] mx-auto rounded-lg"
              >
            </div>
          </template>
        </UModal>
      </section>

      <!-- Contact Section -->
      <section id="contact" class="py-24 bg-neutral-50 border-t border-neutral-200">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-3xl mx-auto text-center space-y-6">
            <h2 class="text-3xl sm:text-4xl font-serif font-black uppercase">
              Contact Us
            </h2>
            <p class="text-neutral-500 text-lg">
              We are here to help you every step of the way. Contact us via email or WhatsApp for a quick response.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NuxtLink
                to="mailto:support@loogy.store"
                class="bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition"
              >
                support@loogy.store
              </NuxtLink>
              <NuxtLink
                to="https://wa.me/201000000000"
                target="_blank"
                class="border border-neutral-300 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:border-amber-700 hover:text-amber-700 transition"
              >
                WhatsApp
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.stroke-text {
  -webkit-text-stroke: 1px black;
  color: transparent;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 40s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
</style>
