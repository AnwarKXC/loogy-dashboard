<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ collapsed?: boolean }>()

const colorMode = useColorMode()
const appConfig = useAppConfig()
const { setPrimaryColor, setNeutralColor } = useTheme()
const router = useRouter()
const superAdmin = useSuperAdminState()

const colors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose'
]
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const displayUser = computed(() => {
  const rawName = superAdmin.value?.name?.trim()
  const email = superAdmin.value?.email
  const role = superAdmin.value?.role
  const name = rawName || email || 'Super Admin'

  const roleLabel = role
    ? role === 'OWNER'
      ? 'Owner'
      : role === 'MANAGER'
        ? 'Manager'
        : 'Sales'
    : undefined

  const initials = rawName
    ? rawName
        .split(/\s+/)
        .filter(Boolean)
        .map(segment => segment[0]!.toUpperCase())
        .slice(0, 2)
        .join('')
    : email?.slice(0, 2).toUpperCase()

  return {
    name,
    email,
    role,
    roleLabel,
    avatar: initials
      ? {
          alt: name,
          text: initials
        }
      : undefined
  }
})

async function handleLogout() {
  await $fetch('/api/superadmin/logout', { method: 'POST' })
  superAdmin.value = null
  await router.replace('/login')
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: displayUser.value.name,
      description: [displayUser.value.roleLabel, displayUser.value.email].filter(Boolean).join(' • ') || undefined,
      avatar: displayUser.value.avatar
    }
  ],
  [
    {
      label: 'Theme',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Primary',
          slot: 'chip',
          chip: appConfig.ui.colors.primary,
          content: {
            align: 'center',
            collisionPadding: 16
          },
          children: colors.map(color => ({
            label: color,
            chip: color,
            slot: 'chip',
            checked: appConfig.ui.colors.primary === color,
            type: 'checkbox',
            onSelect: (e: Event) => {
              e.preventDefault()
              setPrimaryColor(color)
            }
          }))
        },
        {
          label: 'Neutral',
          slot: 'chip',
          chip:
            appConfig.ui.colors.neutral === 'neutral'
              ? 'old-neutral'
              : appConfig.ui.colors.neutral,
          content: {
            align: 'end',
            collisionPadding: 16
          },
          children: neutrals.map(color => ({
            label: color,
            chip: color === 'neutral' ? 'old-neutral' : color,
            slot: 'chip',
            type: 'checkbox',
            checked: appConfig.ui.colors.neutral === color,
            onSelect: (e: Event) => {
              e.preventDefault()
              setNeutralColor(color)
            }
          }))
        }
      ]
    },
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect: (e: Event) => {
            e.preventDefault()
            colorMode.preference = 'light'
          }
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked: (checked: boolean) => {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect: (e: Event) => {
            e.preventDefault()
          }
        }
      ]
    }
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings'
    }
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      onSelect: async (e: Event) => {
        e.preventDefault()
        await handleLogout()
      }
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'
    }"
  >
    <UButton
      :avatar="displayUser.avatar"
      :label="collapsed ? undefined : displayUser.name"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />

    <template #chip-leading="{ item }">
      <span
        :style="{
          '--chip-light': `var(--color-${(item as any).chip}-500)`,
          '--chip-dark': `var(--color-${(item as any).chip}-400)`
        }"
        class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)"
      />
    </template>
  </UDropdownMenu>
</template>
