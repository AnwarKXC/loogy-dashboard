<template>
  <div class="relative overflow-hidden bg-gradient-to-r from-primary/90 via-primary to-amber-500 text-white shadow-sm">
    <div class="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
      <UIcon name="i-lucide-megaphone" class="h-4 w-4" />
      <div class="flex-1 overflow-hidden">
        <div class="flex gap-8 whitespace-nowrap animate-marquee">
          <p>تنبيه هام: فى حالة الرفض يتم التواصل عبر الواتساب لإعادة الشحن أو الاستبدال.</p>
          <p>شحن سريع وآمن لكل المحافظات • استرجاع سهل خلال 14 يوم</p>
          <p>خصومات مميزة على الكولكشن الشتوي الآن</p>
        </div>
      </div>
      <ULink to="/#contact" class="hidden sm:inline-flex text-white/90 hover:text-white text-xs underline">
        تواصل معنا
      </ULink>
    </div>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 22s linear infinite;
}
</style>
