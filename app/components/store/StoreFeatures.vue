<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          لماذا تختارنا
        </p>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          مميزاتنا
        </h2>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="p-3 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            <UIcon name="i-lucide-truck" class="h-6 w-6" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">
              شحن سريع وآمن
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              تسليم لكل المحافظات مع تتبع فوري وإشعارات.
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="p-3 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
            <UIcon name="i-lucide-badge-check" class="h-6 w-6" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">
              منتجات أصلية 100%
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              ضمان مطابقة الوصف والصور مع دعم ما بعد البيع.
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="p-3 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
            <UIcon name="i-lucide-rotate-ccw" class="h-6 w-6" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">
              استبدال واسترجاع سهل
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              سياسة مرنة خلال 14 يوم مع دعم واتساب مباشر.
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </section>
</template>
