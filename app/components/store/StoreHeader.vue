<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
// @ts-expect-error Provided by Nuxt auto-imports at runtime
const colorMode = useColorMode()

const navItems = computed<NavigationMenuItem[]>(() => [{
  label: 'Home',
  to: '/',
  active: route.path === '/'
}, {
  label: 'Products',
  to: '/products',
  active: route.path.startsWith('/products')
}, {
  label: 'Categories',
  to: '/categories',
  active: route.path.startsWith('/categories')
}, {
  label: 'Deals',
  to: '/#deals',
  active: route.hash === '#deals'
}, {
  label: 'Contact',
  to: '/#contact',
  active: route.hash === '#contact'
}])

const isDark = computed(() => colorMode.value === 'dark')
const modeIcon = computed(() => isDark.value ? 'i-lucide-sun' : 'i-lucide-moon')
const modeLabel = computed(() => isDark.value ? 'Switch to light mode' : 'Switch to dark mode')

const toggleMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <UHeader
    title="Loogy"
    to="/"
    class="border-b border-default/60 backdrop-blur"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-sparkles" class="text-primary" />
        <span class="font-semibold text-lg">Loogy</span>
      </div>
    </template>

    <UNavigationMenu :items="navItems" class="hidden md:flex" />

    <template #right>
      <UButton
        to="/search"
        variant="ghost"
        icon="i-lucide-search"
        aria-label="Search"
      />
      <UButton
        variant="ghost"
        :icon="modeIcon"
        :aria-label="modeLabel"
        @click="toggleMode"
      />
      <UButton
        to="/wishlist"
        variant="ghost"
        icon="i-lucide-heart"
        aria-label="Wishlist"
      />
      <UButton
        to="/cart"
        variant="ghost"
        icon="i-lucide-shopping-cart"
        aria-label="Cart"
      />
      <UButton
        to="/account/admin/login"
        variant="soft"
        color="primary"
      >
        Sign in
      </UButton>
    </template>

    <template #panel>
      <div class="p-4 space-y-4">
        <UNavigationMenu :items="navItems" orientation="vertical" />
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="ghost"
            :icon="modeIcon"
            :aria-label="modeLabel"
            @click="toggleMode"
          />
          <UButton
            to="/search"
            variant="ghost"
            icon="i-lucide-search"
            aria-label="Search"
          />
          <UButton
            to="/wishlist"
            variant="ghost"
            icon="i-lucide-heart"
            aria-label="Wishlist"
          />
          <UButton
            to="/cart"
            variant="ghost"
            icon="i-lucide-shopping-cart"
            aria-label="Cart"
          />
          <UButton
            to="/account/admin/login"
            block
            variant="soft"
            color="primary"
          >
            Sign in
          </UButton>
        </div>
      </div>
    </template>
  </UHeader>
</template>
