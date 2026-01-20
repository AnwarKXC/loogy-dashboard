<script setup lang="ts">
// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>سياسة الخصوصية</h1>
    <p>نلتزم بحماية بياناتك الشخصية وعدم مشاركتها مع أي طرف ثالث إلا للضرورة مثل الشحن والدفع.</p>
    <p>يتم استخدام بيانات الاتصال لتأكيد الطلبات وتحديثك بحالة الشحن. يمكنك طلب تعديل أو حذف بياناتك في أي وقت.</p>
    <p>باستخدامك للمتجر فإنك توافق على سياسة الخصوصية هذه.</p>
  </UContainer>
</template>
