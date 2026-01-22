<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')
// Prefer dark mode for admin, allow storefront to follow user preference
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

// Dynamic setup for Layout direction and Language

watchEffect(() => {
  if (isAdminRoute.value) {
    colorMode.preference = 'dark'
  }
})

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  }
})
const { locale } = useI18n()
const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))
useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: computed(() => ({
    lang: locale.value,
    dir: dir.value
  }))
})

// Default Meta - override in pages
const title = computed(() => dir.value ? 'المتجر الإلكتروني' : 'Admin Dashboard')
const description = computed(() => dir.value
  ? 'تسوق أفضل المنتجات بأفضل الأسعار.'
  : 'Professional Admin Dashboard'
)

useSeoMeta({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | ${title.value}` : title.value
  },
  title: title,
  description: description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp :dir="dir">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
