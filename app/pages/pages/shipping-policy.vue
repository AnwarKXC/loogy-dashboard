<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'Shipping Policy',
  description: 'Shipping information, delivery times, and shipping fees to all governorates.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'Shipping Policy',
    'description': 'Shipping information, delivery times, and shipping fees to all governorates.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Shipping Policy' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>Shipping Policy</h1>
    <p>We provide fast and secure shipping to all governorates through trusted carriers. Orders are processed within 24 business hours.</p>
    <p>Shipping fees are clearly displayed on the checkout page before completing your order. In case of delays, we will contact you to confirm the new delivery time.</p>
    <p>Please ensure your address and phone number are correct to facilitate the delivery process.</p>
  </UContainer>
</template>
