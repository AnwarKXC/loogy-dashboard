<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { data: layoutData } = await useFetch('/api/public/storefront/layout')

type LayoutConfig = {
  brand?: {
    name?: string
    logoUrl?: string | null
    homeUrl?: string
  }
  navLinks?: Array<{ label: string, to: string }>
  actions?: {
    showSearch?: boolean
    searchUrl?: string
    showWishlist?: boolean
    showCart?: boolean
    accountUrl?: string
  }
}

const layout = computed<LayoutConfig>(() => layoutData.value?.layout ?? {})
const colorMode = useColorMode()
const { lines: cartLines } = useCart()
const { items: wishlistItems } = useWishlist()

const navItems = computed<NavigationMenuItem[]>(() => {
  const links = layout.value.navLinks?.length
    ? layout.value.navLinks
    : [
        { label: 'Home', to: '/' },
        { label: 'Products', to: '/products' },
        { label: 'Categories', to: '/categories' },
        { label: 'Deals', to: '/#deals' },
        { label: 'Contact Us', to: '/#contact' }
      ]

  return links.map(link => ({
    label: link.label,
    to: link.to,
    active: link.to.startsWith('/#')
      ? route.hash === link.to.replace('/', '')
      : route.path === link.to || route.path.startsWith(`${link.to}/`)
  }))
})

const brandName = computed(() => layout.value.brand?.name ?? 'Turkey Store')
const brandLogo = computed(() => layout.value.brand?.logoUrl ?? null)
const brandUrl = computed(() => layout.value.brand?.homeUrl ?? '/')
const layoutActions = computed(() => layout.value.actions ?? {})

const isDark = computed(() => colorMode.value === 'dark')
const modeIcon = computed(() => isDark.value ? 'i-lucide-sun' : 'i-lucide-moon')
const modeLabel = computed(() => isDark.value ? 'Switch to light mode' : 'Switch to dark mode')

const toggleMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const cartCount = computed(() => cartLines.value.reduce((sum, line) => sum + line.quantity, 0))
const wishlistCount = computed(() => wishlistItems.value.length)
</script>

<template>
  <header class="sticky top-0 z-40 shadow-sm shadow-black/5">
    <StoreAnnouncementBar />

    <UHeader
      :to="brandUrl"
      class="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <!-- Logo could be an image, but using text/icon heavily styled -->
          <div class="bg-gray-900 text-white p-1.5 rounded-lg overflow-hidden">
            <img
              v-if="brandLogo"
              :src="brandLogo"
              :alt="brandName"
              class="size-5 object-contain"
            >
            <UIcon v-else name="i-lucide-shopping-bag" class="size-5" />
          </div>
          <span class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            {{ brandName }}
          </span>
        </div>
      </template>

      <UNavigationMenu
        :items="navItems"
        class="hidden lg:flex"
      />

      <template #right>
        <div class="flex items-center gap-1">
          <UButton
            v-if="layoutActions.showSearch !== false"
            :to="layoutActions.searchUrl || '/search'"
            variant="ghost"
            color="neutral"
            icon="i-lucide-search"
            aria-label="Search"
            class="hidden sm:inline-flex"
          />
          <UButton
            variant="ghost"
            color="neutral"
            :icon="modeIcon"
            :aria-label="modeLabel"
            @click="toggleMode"
          />

          <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          <div v-if="layoutActions.showWishlist !== false" class="relative">
            <UButton
              to="/wishlist"
              variant="ghost"
              color="neutral"
              icon="i-lucide-heart"
              aria-label="Wishlist"
            />
            <span
              v-if="wishlistCount"
              class="absolute top-0 right-0 size-4 flex items-center justify-center text-[10px] rounded-full bg-red-500 text-white leading-none border-2 border-white dark:border-gray-950"
            >
              {{ wishlistCount }}
            </span>
          </div>
          <div v-if="layoutActions.showCart !== false" class="relative">
            <UButton
              to="/cart"
              variant="ghost"
              color="neutral"
              icon="i-lucide-shopping-bag"
              aria-label="Cart"
            />
            <span
              v-if="cartCount"
              class="absolute top-0 right-0 size-4 flex items-center justify-center text-[10px] rounded-full bg-primary text-white leading-none border-2 border-white dark:border-gray-950"
            >
              {{ cartCount }}
            </span>
          </div>
        </div>

        <UButton
          :to="layoutActions.accountUrl || '/admin/login'"
          variant="ghost"
          color="neutral"
          class="hidden sm:inline-flex ml-2"
          icon="i-lucide-user"
        />
      </template>
    </UHeader>
  </header>
</template>
