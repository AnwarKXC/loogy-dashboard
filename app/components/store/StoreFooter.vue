<template>
  <UFooter class="border-t border-default/60 bg-white/80 dark:bg-gray-900/90 backdrop-blur">
    <template #left>
      <div class="space-y-1">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          © {{ new Date().getFullYear() }} Loogy. جميع الحقوق محفوظة.
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          أسرع متجر إلكتروني بدعم كامل للوضع الليلي مع بوابة دفع Paymob.
        </p>
      </div>
    </template>

    <UNavigationMenu
      variant="link"
      :items="[
        { label: 'سياسة الخصوصية', to: '/pages/privacy-policy' },
        { label: 'سياسة الاسترجاع', to: '/pages/refund-policy' },
        { label: 'الشحن', to: '/pages/shipping-policy' },
        { label: 'الشروط والأحكام', to: '/pages/terms-and-conditions' }
      ]"
      class="text-sm"
    >
      <template #right>
        <div class="flex items-center gap-2">
          <UButton icon="i-lucide-facebook" variant="ghost" aria-label="Facebook" />
          <UButton icon="i-lucide-instagram" variant="ghost" aria-label="Instagram" />
          <UButton icon="i-lucide-youtube" variant="ghost" aria-label="YouTube" />
        </div>
      </template>
    </UNavigationMenu>
  </UFooter>
</template>
