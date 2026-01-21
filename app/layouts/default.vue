<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)
const adminBase = '/admin'

const links = computed<NavigationMenuItem[][]>(() => [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: adminBase,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Customers',
  icon: 'i-lucide-users',
  to: `${adminBase}/customers`,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Orders',
  icon: 'i-lucide-shopping-cart',
  to: `${adminBase}/orders`,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Products',
  icon: 'i-lucide-box',
  to: `${adminBase}/products`,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Brands',
  icon: 'i-lucide-badge-check',
  to: `${adminBase}/brands`,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Categories',
  icon: 'i-lucide-layers',
  to: `${adminBase}/categories`,
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'Pages',
  icon: 'i-lucide-file-text',
  type: 'trigger',
  children: [
    {
      label: 'Storefront',
      to: `${adminBase}/front`,
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Storefront Layout',
      to: `${adminBase}/front/layout`,
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Storefront Categories',
      to: `${adminBase}/front/categories`,
      onSelect: () => {
        open.value = false
      }
    }, {
      label: ' SEO',
      to: `${adminBase}/front/seo`,
      onSelect: () => {
        open.value = false
      }
    }
  ]
},

{
  label: 'Settings',
  to: `${adminBase}/settings`,
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'General',
    to: `${adminBase}/settings`,
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Members',
    to: `${adminBase}/settings/members`,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notifications',
    to: `${adminBase}/settings/notifications`,
    onSelect: () => {
      open.value = false
    }
  }]
}]])

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
