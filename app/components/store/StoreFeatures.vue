<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Why Choose Us
        </p>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Our Features
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
              Fast and Safe Shipping
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Delivery to all areas with real-time tracking and notifications.
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
              100% Authentic Products
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Guaranteed to match description and images with after-sales support.
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
              Easy Returns and Exchanges
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Flexible policy within 14 days with direct WhatsApp support.
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </section>
</template>
