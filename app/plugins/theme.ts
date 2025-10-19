export default defineNuxtPlugin({
  name: 'theme-initialization',
  enforce: 'pre', // Run before other plugins
  setup() {
    // This runs on both server (SSR) and client
    const appConfig = useAppConfig()

    // Read cookies - this works on both server and client
    const primaryColorCookie = useCookie<string>('theme-primary-color')
    const neutralColorCookie = useCookie<string>('theme-neutral-color')

    // Apply saved theme immediately during SSR or client hydration
    if (primaryColorCookie.value) {
      appConfig.ui.colors.primary = primaryColorCookie.value
    }

    if (neutralColorCookie.value) {
      appConfig.ui.colors.neutral = neutralColorCookie.value
    }
  }
})
