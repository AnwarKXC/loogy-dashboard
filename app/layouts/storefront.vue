<script setup lang="ts">
const { lines } = useCart()
const cartCount = computed(() => lines.value.reduce((acc, line) => acc + line.quantity, 0))

type LayoutData = {
  brand: {
    name: string
    logoUrl?: string | null
    homeUrl: string
  }
  navLinks: Array<{ label: string, to: string }>
  actions: {
    showSearch: boolean
    searchUrl: string
    showWishlist: boolean
    showCart: boolean
    accountUrl: string
  }
  footer: {
    copyright: string
    description: string
    links: Array<{ label: string, to: string }>
    socials: Array<{ label: string, icon: string, url: string }>
  }
}

const { data: layoutData } = await useFetch<{ layout: LayoutData }>('/api/public/storefront/layout')

const layout = computed<LayoutData>(() => layoutData.value?.layout ?? {
  brand: { name: 'Store', logoUrl: null, homeUrl: '/' },
  navLinks: [],
  actions: { showSearch: true, searchUrl: '/search', showWishlist: true, showCart: true, accountUrl: '/admin/login' },
  footer: { copyright: '', description: '', links: [], socials: [] }
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-gradient-to-b from-white via-slate-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100"
  >
    <header class="fixed top-0 left-0 right-0 z-50 bg-neutral-500/10  backdrop-blur-md border-b border-transparent transition-all duration-300">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="h-14 flex items-center justify-between">
          <!-- Left: Nav -->
          <div class="flex items-center gap-8">
            <button class="lg:hidden" aria-label="Menu">
              <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
            </button>
            <nav class="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
              <NuxtLink
                v-for="link in layout.navLinks"
                :key="link.to"
                :to="link.to"
                class="hover:text-amber-700 transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>
          </div>

          <!-- Center: Logo -->
          <NuxtLink :to="layout.brand.homeUrl" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img
              v-if="layout.brand.logoUrl"
              :src="layout.brand.logoUrl"
              :alt="layout.brand.name"
              class="h-10 w-auto object-contain"
            >
            <span v-else class="text-xl font-black tracking-tighter">{{ layout.brand.name }}</span>
          </NuxtLink>

          <!-- Right: Actions -->
          <div class="flex items-center gap-4">
            <!-- Language Switcher -->
            <StoreLanguageSwitcher />

            <NuxtLink
              v-if="layout.actions.showSearch"
              :to="layout.actions.searchUrl"
              class="hover:text-amber-700 transition"
              aria-label="Search"
            >
              <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
            </NuxtLink>
            <NuxtLink
              v-if="layout.actions.showWishlist"
              to="/wishlist"
              class="hover:text-amber-700 transition"
              aria-label="Favorites"
            >
              <UIcon name="i-heroicons-heart" class="w-5 h-5" />
            </NuxtLink>
            <NuxtLink
              v-if="layout.actions.showCart"
              to="/cart"
              class="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-amber-700 transition relative"
              aria-label="Cart"
            >
              <span class="text-xs font-bold uppercase tracking-wider">Cart</span>
              <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4" />
              <div
                v-if="cartCount > 0"
                class="absolute -top-2 -right-1 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
              >
                {{ cartCount }}
              </div>
            </NuxtLink>
            <NuxtLink
              to="/profile"
              class="hover:text-amber-700 transition"
              aria-label="My Orders"
              title="My Orders"
            >
              <UIcon name="i-lucide-package" class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>
    <main class="flex-1 mt-14">
      <slot />
    </main>
    <footer class="bg-[#0a0a0a] text-white pt-32 pb-8 overflow-hidden font-sans border-t border-white/5 relative">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Top Section: Newsletter & Brand Message -->
        <div class="flex flex-col lg:flex-row gap-16 lg:gap-32 mb-24">
          <!-- Left: Big CTA -->
          <div class="lg:w-1/2">
            <h2 class="text-5xl lg:text-7xl font-serif font-light mb-8 leading-tight">
              Join our <span class="italic text-amber-500">exclusive</span> list
            </h2>
            <form class="relative max-w-lg">
              <input
                type="email"
                placeholder="your@email.com"
                class="w-full bg-transparent border-b border-white/20 py-4 text-xl focus:outline-none focus:border-amber-500 transition-colors placeholder-neutral-600"
              >
              <button
                type="submit"
                class="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-widest hover:text-amber-500 transition-colors"
              >
                Subscribe
              </button>
            </form>
            <p class="mt-6 text-neutral-500 text-sm">
              Get early access to new collections and special offers.
            </p>
          </div>

          <!-- Right: Links Grid -->
          <div class="lg:w-1/2 grid grid-cols-2 md:grid-cols-3 gap-8">
            <!-- Navigation -->
            <div class="space-y-6">
              <h4 class="text-xs font-black uppercase tracking-widest text-neutral-500">
                Shop
              </h4>
              <ul class="space-y-4">
                <li v-for="link in layout.navLinks" :key="link.to">
                  <NuxtLink :to="link.to" class="text-sm text-neutral-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block">
                    {{ link.label }}
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <!-- Legal -->
            <div class="space-y-6">
              <h4 class="text-xs font-black uppercase tracking-widest text-neutral-500">
                Legal
              </h4>
              <ul class="space-y-4">
                <li v-for="link in layout.footer.links" :key="link.to">
                  <NuxtLink :to="link.to" class="text-sm text-neutral-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block">
                    {{ link.label }}
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <!-- Socials -->
            <div class="space-y-6">
              <h4 class="text-xs font-black uppercase tracking-widest text-neutral-500">
                Follow Us
              </h4>
              <div class="flex flex-col gap-4">
                <a
                  v-for="social in layout.footer.socials"
                  :key="social.label"
                  :href="social.url || '#'"
                  target="_blank"
                  class="group flex items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                    <UIcon :name="social.icon" class="w-4 h-4" />
                  </div>
                  <span>{{ social.label }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bottom: Marquee & Copyright -->
        <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-2">
            <div v-if="!layout.brand.logoUrl" class="w-8 h-8 rotate-45 bg-white" />
            <img
              v-else
              :src="layout.brand.logoUrl"
              :alt="layout.brand.name"
              class="h-8 w-auto brightness-0 invert opacity-80"
            >
            <span class="text-xs text-neutral-500 font-bold tracking-widest uppercase ml-4">
              {{ layout.footer.copyright }}
            </span>
          </div>

          <div class="text-[10px] font-mono text-neutral-800 uppercase tracking-widest">
            Designed for Luxury
          </div>
        </div>
      </div>

      <!-- Massive Brand Name Background -->
      <div class="absolute bottom-[-5vw] left-0 right-0 overflow-hidden pointer-events-none opacity-[0.07] select-none">
        <h1 class="text-[25vw] leading-none font-serif font-black text-center whitespace-nowrap tracking-tighter text-white">
          {{ layout.brand.name }}
        </h1>
      </div>
    </footer>
  </div>
</template>

<style>
/* Global override for UCarousel arrows - remove translate-y animation on hover */
[data-scope="carousel"] button[data-part="prev-trigger"],
[data-scope="carousel"] button[data-part="next-trigger"] {
  transition: background-color 0.15s ease, opacity 0.15s ease !important;
}

[data-scope="carousel"] button[data-part="prev-trigger"]:hover,
[data-scope="carousel"] button[data-part="next-trigger"]:hover {
  transform: translateY(-50%) !important;
}

/* Ensure carousel buttons don't animate on hover - more specific selectors */
.product-carousel-wrapper button,
[data-scope="carousel"] [data-part="prev-trigger"],
[data-scope="carousel"] [data-part="next-trigger"] {
  --tw-translate-y: -50% !important;
}
</style>
