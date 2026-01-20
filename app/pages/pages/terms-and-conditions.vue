<script setup lang="ts">
// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})
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
