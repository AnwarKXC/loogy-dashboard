<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[{
  label: 'Account',
  icon: 'i-lucide-user',
  to: '/admin/settings',
  exact: true
}, {
  label: 'Super admins',
  icon: 'i-lucide-users',
  to: '/admin/settings/members'
}, {
  label: 'Notifications',
  icon: 'i-lucide-bell',
  to: '/admin/settings/notifications'
}], [{
  label: 'Store General',
  icon: 'i-lucide-store',
  to: '/admin/settings/store'
}, {
  label: 'Contact Info',
  icon: 'i-lucide-phone',
  to: '/admin/settings/contact'
}, {
  label: 'Social Links',
  icon: 'i-lucide-share-2',
  to: '/admin/settings/social'
}, {
  label: 'WhatsApp',
  icon: 'i-simple-icons-whatsapp',
  to: '/admin/settings/whatsapp'
}], [{
  label: 'Shipping',
  icon: 'i-lucide-truck',
  to: '/admin/settings/shipping'
}, {
  label: 'Pricing',
  icon: 'i-lucide-coins',
  to: '/admin/settings/pricing'
}, {
  label: 'Promo Codes',
  icon: 'i-lucide-ticket',
  to: '/admin/settings/promo-codes'
}, {
  label: 'Tax Settings',
  icon: 'i-lucide-percent',
  to: '/admin/settings/tax'
}]] satisfies NavigationMenuItem[][]
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
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-5xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
