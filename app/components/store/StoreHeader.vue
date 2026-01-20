<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
// @ts-expect-error Provided by Nuxt auto-imports at runtime
const colorMode = useColorMode()
const { lines: cartLines } = useCart()
const { items: wishlistItems } = useWishlist()

const navItems = computed<NavigationMenuItem[]>(() => [{
  label: 'الرئيسية',
  to: '/',
  active: route.path === '/'
}, {
  label: 'المنتجات',
  to: '/products',
  active: route.path.startsWith('/products')
}, {
  label: 'الفئات',
  to: '/categories',
  active: route.path.startsWith('/categories')
}, {
  label: 'العروض',
  to: '/#deals',
  active: route.hash === '#deals'
}, {
  label: 'تواصل معنا',
  to: '/#contact',
  active: route.hash === '#contact'
}])

const isDark = computed(() => colorMode.value === 'dark')
const modeIcon = computed(() => isDark.value ? 'i-lucide-sun' : 'i-lucide-moon')
const modeLabel = computed(() => isDark.value ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن')

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
      to="/"
      class="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <!-- Logo could be an image, but using text/icon heavily styled -->
          <div class="bg-gray-900 text-white p-1.5 rounded-lg">
            <UIcon name="i-lucide-shopping-bag" class="size-5" />
          </div>
          <span class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            Turkey Store
          </span>
        </div>
      </template>

      <UNavigationMenu
        :items="navItems"
        class="hidden lg:flex"
        :ui="{
          link: {
            active: 'text-primary font-bold after:bg-primary',
            base: 'text-base font-medium hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-transparent hover:after:bg-primary/50 after:transition-colors'
          }
        }"
      />

      <template #right>
        <div class="flex items-center gap-1">
          <UButton
            to="/search"
            variant="ghost"
            color="gray"
            icon="i-lucide-search"
            aria-label="بحث"
            class="hidden sm:inline-flex"
          />
          <UButton
            variant="ghost"
            color="gray"
            :icon="modeIcon"
            :aria-label="modeLabel"
            @click="toggleMode"
          />

          <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          <div class="relative">
            <UButton
              to="/wishlist"
              variant="ghost"
              color="gray"
              icon="i-lucide-heart"
              aria-label="المفضلة"
            />
            <span
              v-if="wishlistCount"
              class="absolute top-0 right-0 size-4 flex items-center justify-center text-[10px] rounded-full bg-red-500 text-white leading-none border-2 border-white dark:border-gray-950"
            >
              {{ wishlistCount }}
            </span>
          </div>
          <div class="relative">
            <UButton
              to="/cart"
              variant="ghost"
              color="gray"
              icon="i-lucide-shopping-bag"
              aria-label="السلة"
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
          to="/admin/login"
          variant="ghost"
          color="gray"
          class="hidden sm:inline-flex ml-2"
          icon="i-lucide-user"
        />
      </template>

      <template #panel>
        <div class="p-4 space-y-4">
          <UNavigationMenu :items="navItems" orientation="vertical" />
          <div class="grid grid-cols-2 gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :icon="modeIcon"
              :aria-label="modeLabel"
              @click="toggleMode"
            />
            <UButton
              to="/search"
              variant="ghost"
              color="neutral"
              icon="i-lucide-search"
              aria-label="بحث"
            />
            <UButton
              to="/wishlist"
              variant="ghost"
              color="neutral"
              icon="i-lucide-heart"
              aria-label="المفضلة"
            >
              <span v-if="wishlistCount" class="ml-2 text-xs text-primary font-semibold">{{ wishlistCount }}</span>
            </UButton>
            <UButton
              to="/cart"
              variant="ghost"
              color="neutral"
              icon="i-lucide-shopping-cart"
              aria-label="السلة"
            >
              <span v-if="cartCount" class="ml-2 text-xs text-primary font-semibold">{{ cartCount }}</span>
            </UButton>
            <UButton
              to="/admin/login"
              block
              variant="soft"
              color="primary"
              class="col-span-2"
            >
              تسجيل الدخول
            </UButton>
          </div>
        </div>
      </template>
    </UHeader>
  </header>
</template>
