<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[
  {
    label: 'Storefront',
    icon: 'i-lucide-monitor',
    to: '/admin/front',
    exact: true
  }, {
    label: 'Layout',
    icon: 'i-lucide-layout',
    to: '/admin/front/layout'
  }, {
    label: 'Categories',
    icon: 'i-lucide-layers',
    to: '/admin/front/categories'
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
