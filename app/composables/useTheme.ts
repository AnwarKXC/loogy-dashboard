import { createSharedComposable } from '@vueuse/core'

const _useTheme = () => {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()

  // Cookie keys for persistence
  const primaryColorCookie = useCookie<string>('theme-primary-color', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  })

  const neutralColorCookie = useCookie<string>('theme-neutral-color', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  })

  // Set primary color and persist
  const setPrimaryColor = (color: string) => {
    appConfig.ui.colors.primary = color
    primaryColorCookie.value = color
  }

  // Set neutral color and persist
  const setNeutralColor = (color: string) => {
    appConfig.ui.colors.neutral = color
    neutralColorCookie.value = color
  }

  return {
    setPrimaryColor,
    setNeutralColor,
    primaryColor: computed(() => appConfig.ui.colors.primary),
    neutralColor: computed(() => appConfig.ui.colors.neutral),
    colorMode
  }
}

export const useTheme = createSharedComposable(_useTheme)
