<script setup lang="ts">
const props = defineProps<{
  title?: string
  description?: string
  primaryCta?: { label: string, to: string }
  secondaryCta?: { label: string, to: string }
}>
</script>

<template>
  <UPageHero
    :title="props.title || 'Shop the latest drops'"
    :description="props.description || 'Curated products, fast checkout, and flexible payments powered by Paymob.'"
    orientation="horizontal"
    :links="[
      { label: props.primaryCta?.label || 'Browse products', to: props.primaryCta?.to || '/products', color: 'primary' },
      { label: props.secondaryCta?.label || 'View deals', to: props.secondaryCta?.to || '/#deals', variant: 'ghost' }
    ]"
  >
    <div class="grid grid-cols-2 gap-3 max-w-lg mx-auto">
      <div class="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/15 via-white to-primary/5 ring-1 ring-default" />
      <div class="aspect-[4/5] rounded-2xl bg-gradient-to-br from-amber-200/40 via-white to-amber-100/50 ring-1 ring-default translate-y-6" />
    </div>
  </UPageHero>
</template>
