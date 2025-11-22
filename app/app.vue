<script setup lang="ts">
const colorMode = useColorMode()
const toast = useToast()
const { $socket } = useNuxtApp()
const user = useSessionUser()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

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

  // Listen for new orders
  if ($socket) {
    $socket.on('connect', () => {
      if (user.value) {
        $socket.emit('join', { userId: user.value.id, isAdmin: true })
      }
    })

    // If already connected
    if ($socket.connected && user.value) {
      $socket.emit('join', { userId: user.value.id, isAdmin: true })
    }

    $socket.on('order:new', (data: any) => {
      toast.add({
        title: 'New Order Received',
        description: `Order #${data.id} from ${data.customerName}`,
        icon: 'i-lucide-shopping-bag',
        color: 'primary',
        actions: [{
          label: 'View',
          click: () => navigateTo(`/orders/${data.id}`)
        }]
      })
    })
  }
})

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
    lang: 'en'
  }
})

const title = 'Nuxt Dashboard Template'
const description = 'A professional dashboard template built with Nuxt UI, featuring multiple pages, data visualization, and comprehensive management capabilities for creating powerful admin interfaces.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
