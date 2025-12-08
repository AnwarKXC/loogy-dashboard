import { computed, watchEffect } from 'vue'
import { createSharedComposable } from '@vueuse/core'

const defaults = {
  storefront: { primary: 'indigo', neutral: 'slate', mode: 'light' as const },
  admin: { primary: 'green', neutral: 'zinc', mode: 'system' as const }
}

const _useTheme = () => {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()
  const route = useRoute()

  const adminPrimaryCookie = useCookie<string>('admin-primary-color', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })
  const adminNeutralCookie = useCookie<string>('admin-neutral-color', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  const storeModeCookie = useCookie<'light' | 'dark' | 'system'>('storefront-color-mode', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })
  const adminModeCookie = useCookie<'light' | 'dark' | 'system'>('admin-color-mode', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  const isStorefront = computed(() => !route.path.startsWith('/admin'))

  const applyPalette = () => {
    const palette = isStorefront.value
      ? {
          primary: defaults.storefront.primary,
          neutral: defaults.storefront.neutral,
          mode: storeModeCookie.value || defaults.storefront.mode
        }
      : {
          primary: adminPrimaryCookie.value || defaults.admin.primary,
          neutral: adminNeutralCookie.value || defaults.admin.neutral,
          mode: adminModeCookie.value || defaults.admin.mode
        }

    appConfig.ui.colors.primary = palette.primary
    appConfig.ui.colors.neutral = palette.neutral
    colorMode.preference = palette.mode
  }

  watchEffect(() => {
    applyPalette()
  })

  const setPrimaryColor = (color: string) => {
    if (!isStorefront.value) {
      adminPrimaryCookie.value = color
      applyPalette()
    }
  }

  const setNeutralColor = (color: string) => {
    if (!isStorefront.value) {
      adminNeutralCookie.value = color
      applyPalette()
    }
  }

  const setColorMode = (mode: 'light' | 'dark' | 'system') => {
    colorMode.preference = mode
    if (isStorefront.value) {
      storeModeCookie.value = mode
    } else {
      adminModeCookie.value = mode
    }
  }

  return {
    setPrimaryColor,
    setNeutralColor,
    setColorMode,
    primaryColor: computed(() => appConfig.ui.colors.primary),
    neutralColor: computed(() => appConfig.ui.colors.neutral),
    colorMode,
    isStorefront
  }
}

export const useTheme = createSharedComposable(_useTheme)
