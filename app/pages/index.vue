<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'

definePageMeta({
  layout: 'storefront'
})

const fallbackHeroImage = 'https://placehold.co/1200x800/e5e5e5/171717?text=Hero'
const fallbackHeroImage2 = 'https://placehold.co/1200x800/1e293b/ffffff?text=Hero+Alt'
const fallbackCardImage = 'https://placehold.co/600x800/f3f4f6/171717?text=Product'
const fallbackCategoryImage = 'https://placehold.co/1200x900/e5e5e5/171717?text=Category'

type HomeProduct = {
  id: number
  name: string
  price: number
  image?: string | null
  slug?: string
  category?: { name?: string | null } | null
  status?: string
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

type HomeReview = {
  id: number
  user: string
  msg: string
  time: string
  avatar?: string
  platform?: string
}

type HomeResponse = {
  hero?: {
    title?: string
    subtitle?: string
    ctaLabel?: string
    ctaTo?: string
    slides?: Array<Record<string, unknown>>
  }
  sections?: {
    newArrivals?: HomeProduct[]
    collections?: HomeProduct[]
    egyptProducts?: HomeProduct[]
    previousOrders?: HomeProduct[]
  }
  galleryImages?: string[]
  reviews?: HomeReview[]
  brands?: HomeBrand[]
  categories?: HomeCategory[]
}

const { data: homeData } = await useFetch('/api/public/storefront/home')
const router = useRouter()
const toast = useToast()
const { add: addToCart } = useCart()

const home = computed<HomeResponse>(() => (homeData.value ?? {}) as HomeResponse)

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

const formatPrice = (price?: number | null) => (typeof price === 'number' ? `$${price.toFixed(2)}` : '')

const newArrivals = computed(() =>
  ((home.value.sections?.newArrivals ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image ?? fallbackCardImage
  }))
)

const collections = computed(() =>
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
const reviews = computed(() => home.value.reviews ?? [])

const egyptProducts = computed(() =>
  ((home.value.sections?.egyptProducts ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image ?? fallbackCardImage
  }))
)

const forSaleProducts = computed(() =>
  ((home.value.sections?.previousOrders ?? []) as HomeProduct[]).map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    status: item.status ?? 'Available',
    image: item.image ?? fallbackCardImage
  }))
)

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
      title: 'تمت الإضافة إلى السلة',
      description: item.name,
      color: 'success'
    })
  } catch (error: unknown) {
    const dataMessage = (error as { data?: { message?: string } })?.data?.message
    const message = typeof dataMessage === 'string'
      ? dataMessage
      : error instanceof Error
        ? error.message
        : 'حاول مرة أخرى'

    toast.add({
      title: 'تعذر الإضافة للسلة',
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
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
    <!-- Main Content -->
    <main class="flex-grow pt-20">
      <!-- Hero Section -->
      <section class="relative bg-neutral-50 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        <UCarousel
          ref="heroCarousel"
          v-slot="{ item }: { item: { title: string, title2: string, title3: string, subtitle: string, image: string, image2: string, cta: string, to: string } }"
          :items="heroSlides"
          :ui="{
            item: 'basis-full',
            container: 'snap-x snap-mandatory',
            arrows: 'hidden'
          }"
          :autoplay="{ delay: 6000, stopOnInteraction: false }"
          loop
          @select="onHeroSlideSelect"
        >
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
              <!-- Left: Text Content -->
              <div class="lg:col-span-5 relative z-20 pt-12 lg:pt-0">
                <div class="mb-4">
                  <ul class="flex flex-col text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase gap-1 mb-8 pl-1">
                    <li>
                      <NuxtLink to="/products?search=men" class="text-neutral-900 hover:text-amber-700 transition">
                        Men
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/products?search=women" class="hover:text-neutral-900 transition">
                        Women
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/products?search=kids" class="hover:text-neutral-900 transition">
                        Kids
                      </NuxtLink>
                    </li>
                  </ul>
                </div>

                <h1 class="text-8xl sm:text-9xl xl:text-[10rem] font-serif font-black uppercase leading-[0.85] tracking-tighter text-neutral-900 mb-6">
                  <span>{{ item.title }}</span><br>
                  <span>{{ item.title2 }}</span><br>
                  <span>{{ item.title3 }}</span>
                </h1>

                <p class="text-xl text-neutral-500 font-light mb-12 pl-2">
                  {{ item.subtitle }}
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
                    :to="item.to"
                    class="bg-neutral-200/80 hover:bg-neutral-900 hover:text-white transition-all duration-300 px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-4 group"
                  >
                    {{ item.cta }}
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </NuxtLink>
                  <div class="flex border border-neutral-200">
                    <button
                      type="button"
                      class="w-12 h-12 flex items-center justify-center hover:bg-white transition hover:text-amber-700"
                      aria-label="Previous slide"
                      @click="goToPrevSlide"
                    >
                      <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
                    </button>
                    <div class="w-px bg-neutral-200" />
                    <button
                      type="button"
                      class="w-12 h-12 flex items-center justify-center hover:bg-white transition hover:text-amber-700"
                      aria-label="Next slide"
                      @click="goToNextSlide"
                    >
                      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5" />
                    </button>
                  </div>
                  <!-- Slide Indicators -->
                  <div class="flex gap-2 ml-4">
                    <button
                      v-for="(_, idx) in heroSlides"
                      :key="idx"
                      type="button"
                      class="w-2 h-2 rounded-full transition-all duration-300"
                      :class="activeSlideIndex === idx ? 'bg-neutral-900 w-6' : 'bg-neutral-300 hover:bg-neutral-500'"
                      :aria-label="`Go to slide ${idx + 1}`"
                      @click="heroCarouselRef?.emblaApi?.scrollTo(idx)"
                    />
                  </div>
                </div>
              </div>

              <!-- Right: Images (Overlapping) -->
              <NuxtLink :to="item.to" class="lg:col-span-7 relative h-[60vh] lg:h-[85vh] w-full flex items-center justify-center lg:justify-end">
                <!-- Base Image (White) -->
                <div class="relative w-[90%] h-full bg-gray-200 overflow-hidden ml-auto">
                  <img :src="item.image" class="w-full h-full object-cover object-top" alt="Man in White Collection">
                  <!-- Decorative Text Overlay on Image -->
                  <h2 class="absolute bottom-16 right-[-2rem] text-6xl xl:text-8xl font-black text-neutral-900 opacity-80 whitespace-nowrap z-0 hidden lg:block">
                    Man In White
                  </h2>
                </div>

                <!-- Floating Overlay Image (Black) -->
                <div class="absolute top-[20%] lg:top-[15%] left-0 lg:-left-[5%] w-[55%] lg:w-[45%] aspect-[3/4] bg-neutral-900 border-4 lg:border-8 border-white shadow-2xl z-30 overflow-hidden flex flex-col items-center justify-center group">
                  <div class="absolute inset-0 bg-neutral-900/40 z-10 transition-opacity group-hover:opacity-0" /> <!-- Dimmer -->
                  <img :src="item.image2" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="Man in Black Collection">

                  <!-- Star Graphic & Text -->
                  <div class="relative z-20 text-center text-white">
                    <div class="mb-4 animate-spin-slow">
                      <!-- Star SVG -->
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        class="mx-auto stroke-current"
                        stroke-width="1"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <p class="text-3xl lg:text-4xl font-serif italic text-white mix-blend-difference">
                      Man In Black
                    </p>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </UCarousel>
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
      <!-- New This Week -->
      <section id="deals" class="container mx-auto px-4 sm:px-6 lg:px-8 py-32 border-t border-neutral-200">
        <div class="flex flex-col sm:flex-row justify-between items-end mb-16 pb-4">
          <h2 class="text-5xl lg:text-7xl font-serif font-black uppercase leading-none">
            New<br>This Week <span class="text-amber-700 text-2xl lg:text-3xl font-sans font-bold align-top ml-2">(50)</span>
          </h2>
          <NuxtLink
            to="/products"
            class="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-amber-700 hover:border-amber-700 transition mt-6 sm:mt-0"
          >
            See All Products
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
          <div v-for="item in newArrivals" :key="item.id" class="group">
            <div class="relative bg-neutral-100 aspect-[4/5] mb-6 overflow-hidden">
              <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="block">
                <img :src="item.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" :alt="item.name">
              </NuxtLink>
              <button
                type="button"
                class="absolute bottom-0 right-0 w-12 h-12 bg-white/90 hover:bg-black hover:text-white flex items-center justify-center transition-colors duration-300 z-10"
                aria-label="Add to cart"
                @click.stop.prevent="handleAddToCart(item)"
              >
                <UIcon name="i-heroicons-plus" class="w-5 h-5" />
              </button>
              <div v-if="item.id === 1" class="absolute top-4 left-4">
                <span class="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest">New</span>
              </div>
            </div>

            <div class="flex justify-between items-start gap-4">
              <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="text-sm font-bold uppercase tracking-wide leading-relaxed group-hover:text-neutral-600 transition">
                {{ item.name }}
              </NuxtLink>
              <span class="text-sm font-medium font-serif">{{ formatPrice(item.price) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Promotional Categories Grid -->
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="(cat, idx) in promotionalCategories"
            :key="idx"
            class="relative overflow-hidden rounded-[2rem] aspect-[16/9] group cursor-pointer"
          >
            <!-- Image -->
            <img :src="cat.image" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" :alt="cat.title">

            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <!-- Content -->
            <div class="absolute inset-0 flex flex-col justify-end p-8 text-white">
              <div class="mb-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-3xl lg:text-4xl font-bold font-serif mb-1">
                  {{ cat.title }}
                </h3>
                <p class="text-xs text-gray-300 font-bold uppercase tracking-wider mt-2">
                  {{ cat.count }} - Explore
                </p>
              </div>

              <NuxtLink
                :to="cat.slug ? `/categories/${cat.slug}` : '/categories'"
                class="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-neutral-200 transition-all flex items-center gap-2 w-max"
              >
                <span>View Collection</span>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Available In Egypt (Slider) -->
      <section class="py-24 bg-neutral-50 overflow-hidden">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex justify-between items-end">
          <h2 class="text-4xl lg:text-5xl font-serif font-black uppercase">
            Available In<br><span class="text-amber-700">Egypt</span>
          </h2>
          <div class="flex gap-4">
            <!-- Carousel Navigation Placeholders if needed, UCarousel has arrows -->
          </div>
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <UCarousel
            v-slot="{ item }: { item: { id: number, slug?: string, name: string, image?: string, price: number } }"
            :items="egyptProducts"
            :ui="{
              item: 'basis-full sm:basis-1/2 lg:basis-1/4 pr-4',
              container: 'snap-x snap-mandatory'
            }"
            arrows
          >
            <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="group cursor-pointer w-full relative block">
              <div class="aspect-[3/4] overflow-hidden bg-gray-200 mb-4 relative">
                <img :src="item.image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" draggable="false">
                <div class="absolute top-4 left-4 bg-black/80 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                  Fast Shipping
                </div>
              </div>
              <h3 class="font-bold uppercase text-sm mb-1">
                {{ item.name }}
              </h3>
              <p class="font-serif text-neutral-500">
                {{ formatPrice(item.price) }}
              </p>
            </NuxtLink>
          </UCarousel>
        </div>
      </section>

      <!-- For Sale Section (Fancy Grid) -->
      <section class="py-24 bg-neutral-950 relative overflow-hidden">
        <!-- Background Decorative Elements -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black opacity-40 pointer-events-none" />
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-gradient-to-b from-amber-900/10 to-transparent blur-3xl pointer-events-none" />

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="flex flex-col items-center mb-20">
            <span class="text-amber-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Limited Time Offers</span>
            <h2 class="text-5xl lg:text-7xl font-serif font-black uppercase text-white tracking-tight mb-6">
              For Sale
            </h2>
            <div class="w-16 h-1 bg-amber-600" />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-16">
            <div
              v-for="item in forSaleProducts"
              :key="item.id"
              class="group relative"
            >
              <!-- Card Body -->
              <div class="relative p-3 transition-all duration-500 group-hover:-translate-y-2">
                <!-- Background Frame -->
                <div class="absolute inset-0 bg-white/5 border border-white/10 group-hover:border-amber-500/50 transition-colors duration-500" />

                <!-- Badge -->
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-black border border-amber-600 text-amber-500 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 z-20 shadow-xl">
                  Sale
                </div>

                <!-- Image Container -->
                <div class="aspect-[3/4] overflow-hidden relative w-full bg-neutral-900">
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
                      class="w-12 h-12 bg-amber-600 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform scale-0 group-hover:scale-100 delay-100"
                      @click.stop.prevent="handleAddToCart(item)"
                    >
                      <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5" />
                    </button>
                    <NuxtLink
                      :to="item.slug ? `/products/${item.slug}` : '/products'"
                      class="text-white text-[10px] font-bold uppercase tracking-widest hover:text-amber-400 transition-colors transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 duration-300 delay-150"
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
                  <span class="font-serif text-lg text-amber-500">{{ formatPrice(item.price) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-24 text-center">
            <NuxtLink to="/products?sale=true" class="group inline-flex items-center gap-4 text-white hover:text-amber-500 transition-colors duration-300">
              <span class="text-xs font-bold uppercase tracking-[0.2em]">Explore All Sale</span>
              <UIcon name="i-heroicons-arrow-long-right" class="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Large Collections Featured -->
      <section class="bg-neutral-100 py-32">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
            <h2 class="text-7xl lg:text-9xl font-serif font-black uppercase leading-[0.8]">
              XIV<br>COLLE<br>CTIONS
            </h2>
            <div class="flex flex-col gap-6 text-sm font-bold uppercase tracking-widest w-full lg:w-auto">
              <div class="flex gap-8 border-b border-gray-300 pb-4 justify-between lg:justify-end">
                <NuxtLink to="/products" class="hover:text-amber-700">
                  Filters (+)
                </NuxtLink>
                <NuxtLink to="/products?sort=newest" class="hover:text-amber-700">
                  Sort (-)
                </NuxtLink>
              </div>
              <div class="flex gap-6 text-gray-400">
                <NuxtLink to="/products" class="text-black">
                  (All)
                </NuxtLink>
                <NuxtLink to="/products?search=men" class="hover:text-black">
                  Men
                </NuxtLink>
                <NuxtLink to="/products?search=women" class="hover:text-black">
                  Women
                </NuxtLink>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              v-for="(item, index) in collections"
              :key="item.id"
              class="group"
              :class="{ 'md:translate-y-16': index === 1, 'md:translate-y-32': index === 2 }"
            >
              <div class="relative bg-white aspect-[3/4] mb-6 overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-500">
                <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="block">
                  <img :src="item.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" :alt="item.name">
                </NuxtLink>
                <div class="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <button
                    type="button"
                    class="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 hover:text-white transition-colors"
                    @click.stop.prevent="handleAddToCart(item)"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                    {{ item.cat }}
                  </p>
                  <NuxtLink :to="item.slug ? `/products/${item.slug}` : '/products'" class="text-lg font-bold uppercase leading-tight">
                    {{ item.name }}
                  </NuxtLink>
                </div>
                <span class="text-lg font-serif italic">{{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-center mt-48">
            <NuxtLink to="/collections" class="group flex flex-col items-center gap-4">
              <span class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors">View All Collections</span>
              <div class="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 animate-bounce" />
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Why Us (Minimal) -->
      <section class="py-32 bg-white relative">
        <div class="container mx-auto px-4 max-w-4xl text-center">
          <div class="mb-16">
            <UIcon name="i-heroicons-sparkles" class="w-12 h-12 text-neutral-900 mx-auto mb-6" />
            <h2 class="text-4xl font-serif font-light uppercase tracking-wide">
              Our Approach
            </h2>
          </div>

          <p class="text-2xl md:text-4xl font-serif font-light leading-relaxed text-neutral-800">
            “at elegant vogue, we blend creativity with <span class="italic font-normal">craftsmanship</span> to create fashion that transcends trends. each design is meticulously crafted.”
          </p>

          <div class="grid grid-cols-3 gap-8 mt-24 pt-12 border-t border-neutral-100">
            <div class="flex flex-col items-center gap-4">
              <span class="text-3xl font-black">01</span>
              <span class="text-[10px] font-bold uppercase tracking-widest">Quality</span>
            </div>
            <div class="flex flex-col items-center gap-4">
              <span class="text-3xl font-black">02</span>
              <span class="text-[10px] font-bold uppercase tracking-widest">Ethics</span>
            </div>
            <div class="flex flex-col items-center gap-4">
              <span class="text-3xl font-black">03</span>
              <span class="text-[10px] font-bold uppercase tracking-widest">Passion</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Reviews (Facebook Messenger Style) -->
      <section class="bg-gray-50 py-32 overflow-hidden">
        <div class="container mx-auto px-4 mb-16 text-center">
          <div class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <UIcon name="i-simple-icons-facebook" class="w-4 h-4" />
            Facebook Reviews
          </div>
          <h2 class="text-4xl font-serif font-bold uppercase">
            What People Say
          </h2>
        </div>

        <div class="flex justify-center gap-8 flex-wrap px-4">
          <div v-for="review in reviews" :key="review.id" class="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm relative transform hover:-translate-y-2 transition-transform duration-300 border border-gray-100">
            <!-- Header -->
            <div class="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
              <img :src="review.avatar" class="w-12 h-12 rounded-full object-cover" :alt="review.user">
              <div>
                <h4 class="font-bold text-sm">
                  {{ review.user }}
                </h4>
                <p class="text-xs text-gray-400 flex items-center gap-1">
                  {{ review.time }} • <UIcon name="i-heroicons-globe-americas" class="w-3 h-3" />
                </p>
              </div>
              <UIcon name="i-simple-icons-messenger" class="w-6 h-6 text-blue-500 ml-auto" />
            </div>

            <!-- Bubble -->
            <div class="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-sm text-gray-800 leading-relaxed relative mb-4">
              {{ review.msg }}
            </div>

            <!-- Reactions -->
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <div class="flex -space-x-1">
                <div class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white text-[8px] text-white">
                  <UIcon name="i-heroicons-hand-thumb-up-solid" class="w-3 h-3" />
                </div>
                <div class="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white text-[8px] text-white">
                  <UIcon name="i-heroicons-heart-solid" class="w-3 h-3" />
                </div>
              </div>
              <span>You and 14 others</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Street Style / Gallery Grid -->
      <section class="bg-white pt-24 pb-24 border-t border-gray-100">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[600px]">
            <!-- Image 1 -->
            <div class="relative h-96 lg:h-full bg-gray-200 group overflow-hidden">
              <img :src="galleryImages[0]" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Street Style 1">
              <div class="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <h3 class="text-3xl font-bold text-white mb-2">
                  Street Style 1
                </h3>
              </div>
            </div>

            <!-- Image 2 (Dark) -->
            <div class="relative h-96 lg:h-full bg-black group overflow-hidden text-white flex flex-col justify-end p-8 mt-0 lg:mt-12">
              <div class="absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity">
                <img :src="galleryImages[1]" class="w-full h-full object-cover" alt="Street Style 2">
              </div>
              <div class="relative z-10">
                <h3 class="text-3xl font-bold mb-2">
                  Street Style 2
                </h3>
                <p class="text-xs font-bold uppercase tracking-widest mb-4">
                  Lookbook
                </p>
              </div>
            </div>

            <!-- Image 3 -->
            <div class="relative h-96 lg:h-full bg-gray-300 group overflow-hidden">
              <img :src="galleryImages[2]" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Street Style 3">
              <div class="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <h3 class="text-3xl font-bold text-white mb-2">
                  Street Style 3
                </h3>
              </div>
            </div>

            <!-- Footer Info Box (Integrated visually) -->
            <div class="bg-white border border-gray-100 p-12 flex flex-col justify-between h-96 lg:h-full mt-0 lg:mt-12">
              <div class="space-y-12">
                <div>
                  <h4 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                    Info
                  </h4>
                  <ul class="space-y-3 font-medium text-sm">
                    <li><NuxtLink to="/pages/terms-and-conditions" class="hover:text-amber-700">Pricing /</NuxtLink></li>
                    <li><NuxtLink to="/pages/privacy-policy" class="hover:text-amber-700">About /</NuxtLink></li>
                    <li><NuxtLink to="/#contact" class="hover:text-amber-700">Contacts</NuxtLink></li>
                  </ul>
                </div>
                <div>
                  <h4 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                    Languages
                  </h4>
                  <ul class="space-y-3 font-medium text-sm uppercase">
                    <li><NuxtLink to="/?lang=en" class="text-black font-bold">Eng /</NuxtLink></li>
                    <li><NuxtLink to="/?lang=es" class="text-gray-400 hover:text-black">Esp /</NuxtLink></li>
                    <li><NuxtLink to="/?lang=sv" class="text-gray-400 hover:text-black">Sve</NuxtLink></li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 class="text-5xl font-black uppercase leading-[0.85] tracking-tight mb-2">
                  XIV<br>QR
                </h3>
                <div class="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider">
                  Near-field comm
                  <div class="h-px w-8 bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- Contact Section -->
      <section id="contact" class="py-24 bg-neutral-50 border-t border-neutral-200">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-3xl mx-auto text-center space-y-6">
            <h2 class="text-3xl sm:text-4xl font-serif font-black uppercase">
              تواصل معنا
            </h2>
            <p class="text-neutral-500 text-lg">
              نحن هنا لمساعدتك في كل خطوة. تواصل معنا عبر البريد الإلكتروني أو واتساب للرد السريع.
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
