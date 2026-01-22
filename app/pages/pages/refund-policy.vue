<script setup lang="ts">
definePageMeta({
  layout: 'storefront'
})

useSeoMeta({
  title: 'سياسة الاستبدال والاسترجاع',
  description: 'تعرف على شروط الاستبدال والاسترجاع وكيفية إرجاع المنتجات.',
  robots: 'index, follow'
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'WebPage',
    'name': 'سياسة الاستبدال والاسترجاع',
    'description': 'تعرف على شروط الاستبدال والاسترجاع وكيفية إرجاع المنتجات.'
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'الرئيسية', item: '/' },
      { name: 'سياسة الاستبدال والاسترجاع' }
    ]
  })
])
</script>

<template>
  <UContainer class="py-12 space-y-6 prose prose-slate dark:prose-invert max-w-3xl">
    <h1>سياسة الاستبدال والاسترجاع</h1>
    <p>يمكنك طلب الاسترجاع أو الاستبدال خلال 14 يومًا من تاريخ الاستلام بشرط بقاء المنتج في حالته الأصلية مع التغليف والفاتورة.</p>
    <p>رسوم الشحن في حالة الاسترجاع يتحملها العميل ما لم يكن المنتج به عيب تصنيع.</p>
    <p>للبدء برجاء التواصل معنا عبر واتساب أو البريد المسجل في صفحة التواصل.</p>
  </UContainer>
</template>
