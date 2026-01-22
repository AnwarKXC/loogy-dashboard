<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'Exchange and Return Policy',
  description: 'Learn about our exchange and return terms and how to return products.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'Exchange and Return Policy',
    'description': 'Learn about our exchange and return terms and how to return products.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Exchange and Return Policy' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>Exchange and Return Policy</h1>
    <p>You can request a return or exchange within 14 days from the date of receipt, provided the product remains in its original condition with packaging and invoice.</p>
    <p>Shipping costs for returns are borne by the customer unless the product has a manufacturing defect.</p>
    <p>To initiate a return, please contact us via WhatsApp or the email listed on our contact page.</p>
  </UContainer>
</template>
