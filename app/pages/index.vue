<script setup lang="ts">
definePageMeta({
  layout: false
})

const heroSlides = [
  {
    title: 'NEW COLLECTION',
    subtitle: 'Summer 2024',
    image: 'https://placehold.co/1200x800/e5e5e5/171717?text=Man+In+White',
    image2: 'https://placehold.co/1200x800/1e293b/ffffff?text=Man+In+Black',
    cta: 'Go To Shop'
  }
]

const newArrivals = [
  {
    id: 1,
    name: 'Embroidered Seersucker Shirt',
    price: '$99',
    image: 'https://placehold.co/600x750/f3f4f6/171717?text=Shirt+Style+1'
  },
  {
    id: 2,
    name: 'Basic Slim Fit T-Shirt',
    price: '$99',
    image: 'https://placehold.co/600x750/f3f4f6/171717?text=Clean+White+Tee'
  },
  {
    id: 3,
    name: 'Henley T-Shirt',
    price: '$99',
    image: 'https://placehold.co/600x750/f3f4f6/171717?text=Abstract+Print+Tee'
  },
  {
    id: 4,
    name: 'Crewneck T-Shirt',
    price: '$99',
    image: 'https://placehold.co/600x750/f3f4f6/171717?text=Beige+Tee'
  }
]

const collections = [
  {
    id: 1,
    name: 'Basic Heavy Weight T-Shirt',
    price: '$199',
    cat: 'Cotton T Shirt',
    image: 'https://placehold.co/600x800/d1d5db/171717?text=Grunge+Tee'
  },
  {
    id: 2,
    name: 'Soft Wash Straight Fit Jeans',
    price: '$199',
    cat: 'Cotton jeans',
    image: 'https://placehold.co/600x800/e5e5e5/171717?text=Casual+Fit'
  },
  {
    id: 3,
    name: 'Basic Heavy Weight T-Shirt',
    price: '$199',
    cat: 'Cotton T Shirt',
    image: 'https://placehold.co/600x800/f3f4f6/171717?text=Oversized+Tee'
  }
]

const galleryImages = [
  'https://placehold.co/600x800/e5e5e5/171717?text=Street+Style+1',
  'https://placehold.co/600x800/171717/ffffff?text=Street+Style+2',
  'https://placehold.co/600x800/d4d4d4/171717?text=Street+Style+3'
]

// Most popular rounded cards
const popularItems = [
  { name: 'Accessories', image: 'https://placehold.co/400x400/e5e5e5/171717?text=Acc' },
  { name: 'Shoes', image: 'https://placehold.co/400x400/e5e5e5/171717?text=Shoes' },
  { name: 'Jackets', image: 'https://placehold.co/400x400/e5e5e5/171717?text=Jackets' },
  { name: 'Denim', image: 'https://placehold.co/400x400/e5e5e5/171717?text=Denim' }
]
</script>

<template>
  <div class="bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
    <!-- Hero Section -->
    <section class="relative bg-neutral-100/50 mb-20 overflow-hidden">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[85vh]">
          <!-- Left Content -->
          <div class="lg:col-span-4 flex flex-col justify-center py-12 lg:py-0 relative z-20">
            <div class="absolute top-8 left-0 hidden lg:block">
              <ul class="text-xs font-semibold tracking-widest text-neutral-600 uppercase space-y-1">
                <li class="text-black">
                  Men
                </li>
                <li class="hover:text-black cursor-pointer transition">
                  Women
                </li>
                <li class="hover:text-black cursor-pointer transition">
                  Kids
                </li>
              </ul>
            </div>

            <div class="space-y-6 mt-12 lg:mt-0">
              <!-- Search Mobile/Tablet -->
              <div class="w-full mb-8 lg:hidden bg-neutral-200/50 p-3 flex items-center">
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-neutral-500" />
                <span class="ml-3 text-sm text-neutral-500">Search</span>
              </div>

              <h1 class="text-7xl sm:text-8xl lg:text-9xl font-serif font-black uppercase tracking-tighter leading-[0.85]">
                NEW<br>COLLE<br>CTION
              </h1>
              <p class="text-xl sm:text-2xl font-light text-neutral-800">
                {{ heroSlides[0].subtitle }}
              </p>

              <!-- Search Desktop -->
              <div class="hidden lg:flex w-full max-w-xs mt-8 bg-neutral-200/50 p-3 items-center hover:bg-neutral-200 transition cursor-text">
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-neutral-500" />
                <input type="text" placeholder="Search" class="bg-transparent border-none focus:ring-0 w-full ml-3 text-sm placeholder-neutral-500 outline-none">
              </div>

              <div class="pt-8 flex items-center gap-6">
                <button class="bg-neutral-200 hover:bg-neutral-900 hover:text-white transition-all duration-300 px-8 py-4 text-sm font-bold uppercase tracking-widest flex items-center gap-4 group">
                  {{ heroSlides[0].cta }}
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div class="flex gap-0">
                  <button class="w-12 h-12 border border-neutral-300 flex items-center justify-center hover:bg-white transition hover:border-black">
                    <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
                  </button>
                  <button class="w-12 h-12 border-l-0 border border-neutral-300 flex items-center justify-center hover:bg-white transition hover:border-black">
                    <UIcon name="i-heroicons-chevron-right" class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Images -->
          <div class="lg:col-span-8 relative h-[50vh] lg:h-auto">
            <div class="absolute inset-0 flex items-center justify-center lg:items-end lg:justify-end pb-0 pr-0">
              <!-- Main Image -->
              <div class="relative w-full h-full lg:w-[90%] lg:h-[90%]">
                <img :src="heroSlides[0].image" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Hero">
              </div>

              <!-- Floating Image (Secondary) -->
              <div class="hidden lg:block absolute top-[10%] right-[60%] w-[45%] h-[65%] border-8 border-white shadow-2xl z-10 overflow-hidden group">
                <img :src="heroSlides[0].image2" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hero 2">
                <!-- Decorative graphic -->
                <div class="absolute top-1/4 right-1/4 opacity-80 pointer-events-none">
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    fill="none"
                    class="animate-spin-slow"
                  >
                    <path d="M50 0L53 40L90 30L60 60L80 90L50 70L20 90L40 60L10 30L47 40L50 0Z" stroke="white" stroke-width="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- New This Week (Categories/Grid) -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
      <div class="flex flex-col sm:flex-row justify-between items-end mb-16 border-b border-gray-200 pb-4">
        <h2 class="text-5xl lg:text-7xl font-serif font-black uppercase leading-none">
          New<br>This Week <span class="text-blue-600 text-2xl lg:text-3xl font-sans font-bold align-top ml-2">(50)</span>
        </h2>
        <button class="text-sm font-bold uppercase tracking-widest border-b-2 border-transparent hover:border-black transition pb-1 mt-6 sm:mt-0">
          See All Products
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
        <div v-for="item in newArrivals" :key="item.id" class="group cursor-pointer">
          <div class="relative bg-gray-100 aspect-[4/5] mb-6 overflow-hidden">
            <img :src="item.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" :alt="item.name">

            <!-- Plus Button Overlay -->
            <button class="absolute bottom-0 right-0 w-12 h-12 bg-white/80 hover:bg-neutral-900 hover:text-white flex items-center justify-center transition-colors duration-300 z-10 backdrop-blur-sm">
              <UIcon name="i-heroicons-plus" class="w-5 h-5" />
            </button>

            <!-- Badges -->
            <div class="absolute top-4 left-4 flex flex-col gap-2">
              <span v-if="item.id === 1" class="bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-bold uppercase tracking-widest">New</span>
            </div>
          </div>

          <div class="flex justify-between items-start gap-4">
            <h3 class="text-sm font-semibold uppercase tracking-wide leading-relaxed group-hover:underline decoration-1 underline-offset-4">
              {{ item.name }}
            </h3>
            <span class="text-sm font-medium">{{ item.price }}</span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Cotton Blend
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-16 gap-3">
        <button class="w-12 h-12 border border-gray-200 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all rounded-full">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        </button>
        <button class="w-12 h-12 border border-gray-200 flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all rounded-full">
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </button>
      </div>
    </section>

    <!-- Popular Categories (Rounded Slider) -->
    <section class="mb-32 pl-4 lg:pl-0 overflow-hidden">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 class="text-3xl font-serif font-black uppercase">
          Most Popular
        </h2>
      </div>
      <!-- Manual Horizontal Scroll -->
      <div class="flex gap-6 overflow-x-auto pb-8 snap-x pl-4 lg:pl-[max(1rem,calc((100vw-1536px)/2))] scrollbar-hide">
        <div v-for="(cat, idx) in popularItems" :key="idx" class="snap-start shrink-0 w-[280px] sm:w-[350px] group cursor-pointer">
          <div class="aspect-square rounded-full overflow-hidden border border-gray-200 mb-6 relative">
            <img :src="cat.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" :alt="cat.name">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          <h3 class="text-center text-lg font-bold uppercase tracking-widest">
            {{ cat.name }}
          </h3>
          <div class="text-center mt-2 group-hover:translate-x-1 transition-transform">
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </div>
        </div>
        <!-- Add more mock items for scroll -->
        <div v-for="(cat, idx) in popularItems" :key="'dup-'+idx" class="snap-start shrink-0 w-[280px] sm:w-[350px] group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
          <div class="aspect-square rounded-full overflow-hidden border border-gray-200 mb-6 relative">
            <img :src="cat.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" :alt="cat.name">
          </div>
          <h3 class="text-center text-lg font-bold uppercase tracking-widest">
            {{ cat.name }}
          </h3>
        </div>
      </div>
    </section>

    <!-- XIV Collections (Large Featured) -->
    <section class="bg-gray-50 py-24 mb-32">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <h2 class="text-6xl md:text-8xl font-serif font-black uppercase leading-[0.8]">
            XIV<br>COLLE<br>CTIONS<br><span class="text-transparent stroke-text">23-24</span>
          </h2>

          <div class="w-full lg:w-auto flex flex-col items-start lg:items-end gap-6">
            <div class="flex gap-8 text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-4 w-full justify-between lg:justify-end">
              <button class="hover:text-amber-700 transition">
                Filters(+)
              </button>
              <button class="hover:text-amber-700 transition">
                Sorts(-)
              </button>
            </div>
            <div class="flex flex-wrap gap-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <button class="text-black">
                (ALL)
              </button>
              <button class="hover:text-black transition">
                Men
              </button>
              <button class="hover:text-black transition">
                Women
              </button>
              <button class="hover:text-black transition">
                KID
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="(item, index) in collections"
            :key="item.id"
            class="group cursor-pointer"
            :class="{ 'md:mt-16': index === 1, 'md:mt-32': index === 2 }"
          >
            <div class="relative bg-white aspect-[3/4] mb-6 overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow duration-300">
              <img :src="item.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" :alt="item.name">

              <!-- Hover overlay information -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button class="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-200">
                  Quick View
                </button>
              </div>
            </div>
            <div class="flex justify-between items-start pr-2">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {{ item.cat }}
                </p>
                <h3 class="text-lg font-bold uppercase leading-tight max-w-[80%]">
                  {{ item.name }}
                </h3>
              </div>
              <span class="text-lg font-serif italic">{{ item.price }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center mt-24">
          <button class="flex flex-col items-center gap-2 group">
            <span class="text-sm font-bold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">Show More</span>
            <div class="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
              <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 animate-bounce" />
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Our Approach (Why Us) -->
    <section class="py-32 bg-white relative overflow-hidden">
      <!-- Background noise texture could go here -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');" />

      <div class="container mx-auto px-4 text-center max-w-5xl relative z-10">
        <h2 class="text-4xl md:text-5xl font-serif font-light uppercase mb-12 tracking-wide">
          Our Approach to Fashion Design
        </h2>
        <div class="relative inline-block">
          <span class="absolute -top-8 -left-8 text-8xl font-serif text-gray-100 -z-10">"</span>
          <p class="text-xl md:text-3xl text-gray-800 leading-relaxed font-light font-serif">
            at elegant vogue, we blend <span class="font-normal italic">creativity</span> with <span class="font-normal italic">craftsmanship</span> to create fashion that transcends trends and stands the test of time. each design is meticulously crafted, ensuring the highest quality exquisite finish
          </p>
          <span class="absolute -bottom-16 -right-8 text-8xl font-serif text-gray-100 -z-10 transform rotate-180">"</span>
        </div>

        <div class="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto border-t border-gray-100 pt-12">
          <div class="flex flex-col items-center gap-3">
            <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-amber-600" />
            <span class="text-xs font-bold uppercase tracking-widest">Quality</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 text-amber-600" />
            <span class="text-xs font-bold uppercase tracking-widest">Sustainable</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <UIcon name="i-heroicons-heart" class="w-8 h-8 text-amber-600" />
            <span class="text-xs font-bold uppercase tracking-widest">Passion</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews -->
    <section class="bg-neutral-900 text-white py-24">
      <div class="container mx-auto px-4 text-center mb-16">
        <h2 class="text-3xl font-serif font-light uppercase tracking-widest text-neutral-400">
          What They Say
        </h2>
      </div>
      <div class="flex overflow-x-auto gap-8 pb-8 px-4 lg:px-[max(1rem,calc((100vw-1536px)/2))] snap-x scrollbar-hide">
        <div class="snap-center shrink-0 w-[300px] md:w-[400px] bg-neutral-900 p-8 border border-neutral-800 relative group hover:bg-neutral-800 transition-colors">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div class="flex gap-1 text-amber-600 mb-6">
            <UIcon
              v-for="s in 5"
              :key="s"
              name="i-heroicons-star"
              class="w-4 h-4 fill-current"
            />
          </div>
          <p class="text-lg font-serif italic text-gray-300 mb-6 leading-relaxed">
            "Exceptional quality and distinct style. The pieces I bought are my new wardrobe staples. Delivery was surprisingly fast."
          </p>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-neutral-800 rounded-full overflow-hidden">
              <img src="https://placehold.co/100x100/333/fff?text=AD" alt="User">
            </div>
            <div>
              <p class="text-sm font-bold uppercase tracking-wider">
                Alex D.
              </p>
              <p class="text-xs text-neutral-500 uppercase">
                Verified Buyer
              </p>
            </div>
          </div>
        </div>
        <div class="snap-center shrink-0 w-[300px] md:w-[400px] bg-neutral-900 p-8 border border-neutral-800 relative group hover:bg-neutral-800 transition-colors">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div class="flex gap-1 text-amber-600 mb-6">
            <UIcon
              v-for="s in 5"
              :key="s"
              name="i-heroicons-star"
              class="w-4 h-4 fill-current"
            />
          </div>
          <p class="text-lg font-serif italic text-gray-300 mb-6 leading-relaxed">
            "The attention to detail is remarkable. I love the minimalist aesthetic and the fabric feels premium."
          </p>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-neutral-800 rounded-full overflow-hidden">
              <img src="https://placehold.co/100x100/333/fff?text=JM" alt="User">
            </div>
            <div>
              <p class="text-sm font-bold uppercase tracking-wider">
                Jordan M.
              </p>
              <p class="text-xs text-neutral-500 uppercase">
                Verified Buyer
              </p>
            </div>
          </div>
        </div>
        <div class="snap-center shrink-0 w-[300px] md:w-[400px] bg-neutral-900 p-8 border border-neutral-800 relative group hover:bg-neutral-800 transition-colors">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div class="flex gap-1 text-amber-600 mb-6">
            <UIcon
              v-for="s in 5"
              :key="s"
              name="i-heroicons-star"
              class="w-4 h-4 fill-current"
            />
          </div>
          <p class="text-lg font-serif italic text-gray-300 mb-6 leading-relaxed">
            "Finally found a brand that understands modern silhouettes. Can't wait for the next collection."
          </p>
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-neutral-800 rounded-full overflow-hidden">
              <img src="https://placehold.co/100x100/333/fff?text=KS" alt="User">
            </div>
            <div>
              <p class="text-sm font-bold uppercase tracking-wider">
                Casey S.
              </p>
              <p class="text-xs text-neutral-500 uppercase">
                Verified Buyer
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery / Social / Reviews -->
    <section class="bg-neutral-50 pt-24 pb-12">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[600px]">
          <!-- Image 1 -->
          <div class="relative group overflow-hidden h-96 lg:h-full">
            <img :src="galleryImages[0]" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Gallery 1">
            <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            <div class="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
              <p class="text-sm font-bold uppercase tracking-widest">
                @Instagram
              </p>
            </div>
          </div>

          <!-- Image 2 (Offset) -->
          <div class="relative group overflow-hidden mt-0 lg:mt-12 h-96 lg:h-full">
            <img :src="galleryImages[1]" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Gallery 2">
            <div class="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
              <p class="text-sm font-bold uppercase tracking-widest">
                Lookbook
              </p>
            </div>
          </div>

          <!-- Image 3 -->
          <div class="relative group overflow-hidden h-96 lg:h-full">
            <img :src="galleryImages[2]" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Gallery 3">
            <div class="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
              <p class="text-sm font-bold uppercase tracking-widest">
                Editorials
              </p>
            </div>
          </div>

          <!-- Info Box / Footer Preview -->
          <div class="bg-white p-12 flex flex-col justify-between h-96 lg:h-full border border-gray-100">
            <div class="space-y-8">
              <div>
                <p class="text-[10px] uppercase font-bold text-gray-400 mb-4 tracking-widest">
                  Info
                </p>
                <ul class="text-sm font-medium space-y-2">
                  <li class="hover:text-amber-700 cursor-pointer transition">
                    Pricing /
                  </li>
                  <li class="hover:text-amber-700 cursor-pointer transition">
                    About /
                  </li>
                  <li class="hover:text-amber-700 cursor-pointer transition">
                    Contacts
                  </li>
                </ul>
              </div>

              <div>
                <p class="text-[10px] uppercase font-bold text-gray-400 mb-4 tracking-widest">
                  Languages
                </p>
                <ul class="text-sm font-medium space-y-2 uppercase text-gray-500">
                  <li class="text-black">
                    Eng /
                  </li>
                  <li class="hover:text-black cursor-pointer transition">
                    Esp /
                  </li>
                  <li class="hover:text-black cursor-pointer transition">
                    Sve
                  </li>
                </ul>
              </div>
            </div>

            <div class="mt-8">
              <h3 class="text-6xl font-black uppercase leading-[0.85]">
                XIV<br>QR
              </h3>
              <div class="mt-4 text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-2">
                Near-field communication
                <div class="h-px bg-gray-300 w-12" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-end mt-16 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
          <p>&copy; 2024 — Copyright</p>
          <p>Privacy</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Utility for stroke text effect if needed */
.stroke-text {
    -webkit-text-stroke: 1px black;
    color: transparent;
}
/* Hide scrollbar for gallery */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
