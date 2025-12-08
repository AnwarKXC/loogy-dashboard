import { watchEffect } from 'vue'

export default defineNuxtPlugin({
  name: 'theme-initialization',
  enforce: 'pre',
  setup() {
    const appConfig = useAppConfig()
    const route = useRoute()
    const colorMode = typeof useColorMode === 'function' ? useColorMode() : null

    const defaults = {
      storefront: { primary: 'indigo', neutral: 'slate', mode: 'light' as const },
      admin: { primary: 'green', neutral: 'zinc', mode: 'system' as const }
    }

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

    const applyPalette = () => {
      const isStorefront = !route.path.startsWith('/admin')
      const palette = isStorefront
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
      if (colorMode?.preference !== undefined) {
        colorMode.preference = palette.mode
      }
    }

    applyPalette()

    if (import.meta.client) {
      watchEffect(() => {
        applyPalette()
      })
    }
  }
})
