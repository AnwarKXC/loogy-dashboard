<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'الشروط والأحكام',
  description: 'اقرأ الشروط والأحكام الخاصة باستخدام المتجر وإتمام الطلبات.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'الشروط والأحكام',
    'description': 'اقرأ الشروط والأحكام الخاصة باستخدام المتجر وإتمام الطلبات.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'الرئيسية', item: '/' },
      { name: 'الشروط والأحكام' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>الشروط والأحكام</h1>
    <p>باستخدامك لهذا المتجر فأنت توافق على الشروط والأحكام التالية.</p>
    <p>يجب تقديم بيانات صحيحة عند إنشاء الطلبات، ويحق للمتجر إلغاء أي طلب مشبوه أو مخالف.</p>
    <p>الأسعار والخصومات قابلة للتغيير دون إشعار مسبق، ويتم اعتماد السعر عند إتمام الطلب.</p>
    <p>أي نزاع يتم حله بالرجوع للقوانين المحلية المعمول بها.</p>
  </UContainer>
</template>
