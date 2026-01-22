<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using the store and completing orders.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'Terms and Conditions',
    'description': 'Read the terms and conditions for using the store and completing orders.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Terms and Conditions' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>Terms and Conditions</h1>
    <p>By using this store, you agree to the following terms and conditions.</p>
    <p>You must provide accurate information when placing orders. The store reserves the right to cancel any suspicious or non-compliant orders.</p>
    <p>Prices and discounts are subject to change without prior notice. The price at the time of order completion will be applied.</p>
    <p>Any disputes will be resolved in accordance with applicable local laws.</p>
  </UContainer>
</template>
