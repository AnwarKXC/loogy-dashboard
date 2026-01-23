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
    <header class="fixed top-0 left-0 right-0 z-50 bg-neutral-50/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-transparent transition-all duration-300">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="h-20 flex items-center justify-between">
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
              :to="layout.actions.accountUrl"
              class="hover:text-amber-700 transition"
              aria-label="Account"
            >
              <UIcon name="i-heroicons-user" class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>
    <main class="flex-1 mt-14">
      <slot />
    </main>
    <footer class="bg-neutral-900 text-white pt-24 pb-12 overflow-hidden">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
          <!-- Brand -->
          <div class="col-span-1 lg:col-span-1">
            <img
              v-if="layout.brand.logoUrl"
              :src="layout.brand.logoUrl"
              :alt="layout.brand.name"
              class="h-12 w-auto object-contain mb-8 brightness-0 invert"
            >
            <div v-else class="w-12 h-12 rotate-45 bg-white mb-8" />
            <p class="text-gray-400 text-sm leading-relaxed max-w-xs mb-8">
              {{ layout.footer.description }}
            </p>
            <div v-if="layout.footer.socials?.length" class="flex gap-4">
              <a
                v-for="social in layout.footer.socials"
                :key="social.label"
                :href="social.url || '#'"
                class="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                :aria-label="social.label"
                target="_blank"
                rel="noopener"
              >
                <UIcon :name="social.icon" class="w-4 h-4" />
              </a>
            </div>
          </div>

          <!-- Navigation Links -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">
              Navigation
            </h4>
            <ul class="space-y-4 text-sm font-medium">
              <li v-for="link in layout.navLinks" :key="link.to">
                <NuxtLink :to="link.to" class="hover:text-gray-300 transition-colors">
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Footer Links -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">
              Legal
            </h4>
            <ul class="space-y-4 text-sm font-medium">
              <li v-for="link in layout.footer.links" :key="link.to">
                <NuxtLink :to="link.to" class="hover:text-gray-300 transition-colors">
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">
              Newsletter
            </h4>
            <p class="text-sm text-gray-400 mb-6">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form class="flex border-b border-gray-700 pb-2">
              <input
                type="email"
                placeholder="Enter your email"
                class="bg-transparent w-full outline-none text-sm placeholder-gray-600 focus:placeholder-gray-400"
                aria-label="Email address"
              >
              <button type="submit" class="text-xs font-bold uppercase tracking-widest hover:text-gray-300">
                Join
              </button>
            </form>
          </div>
        </div>

        <!-- Bottom -->
        <div class="border-t border-gray-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <p>{{ layout.footer.copyright }}</p>
          <div class="flex gap-8">
            <NuxtLink
              v-for="link in layout.footer.links"
              :key="link.to"
              :to="link.to"
              class="hover:text-white transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
      <!-- Large Background Text Effect -->
      <div class="mt-12 overflow-hidden pointer-events-none opacity-5">
        <h2 class="text-[15vw] leading-none font-black text-center whitespace-nowrap text-white">
          {{ layout.brand.name }}
        </h2>
      </div>
    </footer>
  </div>
</template>
