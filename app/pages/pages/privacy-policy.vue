<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'Privacy Policy',
  description: 'Read our privacy policy and how we protect your personal data.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'Privacy Policy',
    'description': 'Read our privacy policy and how we protect your personal data.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Privacy Policy' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>Privacy Policy</h1>
    <p>We are committed to protecting your personal data and not sharing it with any third party except when necessary, such as for shipping and payment.</p>
    <p>Contact information is used to confirm orders and update you on shipping status. You can request to modify or delete your data at any time.</p>
    <p>By using the store, you agree to this privacy policy.</p>
  </UContainer>
</template>
