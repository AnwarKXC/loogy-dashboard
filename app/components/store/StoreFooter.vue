<script setup lang="ts">
import { computed } from 'vue'

const { data: layoutData } = await useFetch('/api/public/storefront/layout')

type LayoutFooter = {
  copyright?: string
  description?: string
  links?: Array<{ label: string, to: string }>
  socials?: Array<{ label: string, icon: string, url: string }>
}

const footer = computed<LayoutFooter>(() => layoutData.value?.layout?.footer ?? {})

const fallbackLinks = [
  { label: 'Privacy Policy', to: '/pages/privacy-policy' },
  { label: 'Refund Policy', to: '/pages/refund-policy' },
  { label: 'Shipping', to: '/pages/shipping-policy' },
  { label: 'Terms and Conditions', to: '/pages/terms-and-conditions' }
]

const links = computed(() => footer.value.links?.length ? footer.value.links : fallbackLinks)
const socials = computed(() => footer.value.socials ?? [])
</script>

<template>
  <UFooter class="border-t border-default/60 bg-white/80 dark:bg-gray-900/90 backdrop-blur">
    <template #left>
      <div class="space-y-1">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ footer.copyright || `© ${new Date().getFullYear()} Loogy. All rights reserved.` }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ footer.description || 'The fastest online store with full dark mode support and Paymob payment gateway.' }}
        </p>
      </div>
    </template>

    <UNavigationMenu
      variant="link"
      :items="links"
      class="text-sm"
    >
      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            v-for="social in socials"
            :key="social.label"
            :icon="social.icon"
            variant="ghost"
            :aria-label="social.label"
            :to="social.url"
            target="_blank"
          />
        </div>
      </template>
    </UNavigationMenu>
  </UFooter>
</template>
