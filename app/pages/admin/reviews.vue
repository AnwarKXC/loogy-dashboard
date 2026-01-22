<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[
  {
    label: 'Reviews',
    icon: 'i-lucide-message-circle',
    to: '/admin/reviews',
    exact: true
  }, {
    label: 'Testimonials',
    icon: 'i-lucide-quote',
    to: '/admin/reviews/testimonials'
  }
]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full ">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
