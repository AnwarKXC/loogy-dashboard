<script setup lang="ts">
// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>سياسة الشحن</h1>
    <p>نوفر شحن سريع وآمن لكل المحافظات مع شركات موثوقة. يتم تجهيز الطلب خلال 24 ساعة عمل.</p>
    <p>رسوم الشحن تظهر بوضوح في صفحة الدفع قبل إتمام الطلب. في حال التأخير يتم التواصل معك لتأكيد الموعد الجديد.</p>
    <p>يرجى التأكد من صحة بيانات العنوان ورقم الهاتف لتسهيل عملية التوصيل.</p>
  </UContainer>
</template>
