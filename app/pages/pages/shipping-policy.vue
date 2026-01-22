<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'سياسة الشحن',
  description: 'معلومات الشحن ومواعيد التوصيل ورسوم الشحن لجميع المحافظات.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'سياسة الشحن',
    'description': 'معلومات الشحن ومواعيد التوصيل ورسوم الشحن لجميع المحافظات.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'الرئيسية', item: '/' },
      { name: 'سياسة الشحن' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>سياسة الشحن</h1>
    <p>نوفر شحن سريع وآمن لكل المحافظات مع شركات موثوقة. يتم تجهيز الطلب خلال 24 ساعة عمل.</p>
    <p>رسوم الشحن تظهر بوضوح في صفحة الدفع قبل إتمام الطلب. في حال التأخير يتم التواصل معك لتأكيد الموعد الجديد.</p>
    <p>يرجى التأكد من صحة بيانات العنوان ورقم الهاتف لتسهيل عملية التوصيل.</p>
  </UContainer>
</template>
