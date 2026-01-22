<script setup lang="ts">
import * as uiLocales from '@nuxt/ui/locale'

const colorMode = useColorMode()
const route = useRoute()
const { locale } = useI18n()

// Dynamic locale from Nuxt UI locale pack based on i18n
const currentUiLocale = computed(() => {
  // Map i18n locale codes to Nuxt UI locale objects
  return uiLocales[locale.value as keyof typeof uiLocales] ?? uiLocales.en
})

// Direction and language derived from Nuxt UI locale
const dir = computed(() => currentUiLocale.value?.dir ?? 'ltr')
const lang = computed(() => currentUiLocale.value?.code ?? 'en')

// Color mode preferences
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

watchEffect(() => {
  if (isAdminRoute.value) {
    colorMode.preference = 'dark'
  }
})

// Register Service Worker on mount
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

// Global <head> configuration
useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: lang,
    dir: dir
  }
})

// Default SEO Meta (pages can override)
const siteTitle = computed(() => locale.value === 'ar' ? 'المتجر الإلكتروني' : 'E-Commerce Store')
const siteDescription = computed(() =>
  locale.value === 'ar'
    ? 'تسوق أفضل المنتجات بأفضل الأسعار.'
    : 'Shop the best products at the best prices.'
)

useSeoMeta({
  titleTemplate: titleChunk => titleChunk ? `${titleChunk} | ${siteTitle.value}` : siteTitle.value,
  description: siteDescription,
  ogTitle: siteTitle,
  ogDescription: siteDescription,
  ogType: 'website',
  ogImage: '/og-image.png',
  ogSiteName: 'Loogy Store',
  twitterCard: 'summary_large_image',
  twitterImage: '/og-image.png',
  twitterSite: '@loogystore',
  author: 'Loogy Store',
  creator: 'Loogy Store',
  publisher: 'Loogy Store'
})
</script>

<template>
  <UApp :locale="currentUiLocale">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
