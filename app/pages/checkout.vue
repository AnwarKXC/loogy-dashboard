// @ts-nocheck
<script setup lang="ts">
import { ref } from 'vue'
import type { StepperItem } from '@nuxt/ui'
// @ts-expect-error Nuxt provides definePageMeta globally
definePageMeta({
  layout: 'storefront'
})

const steps: StepperItem[] = [
  { title: 'Shipping', icon: 'i-lucide-truck' },
  { title: 'Payment', icon: 'i-lucide-credit-card' },
  { title: 'Review', icon: 'i-lucide-check-circle-2' }
]

const active = ref(0)
</script>

<template>
  <UContainer class="py-12 space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        Checkout
      </h1>
      <ULink to="/cart" class="text-primary">Back to cart</ULink>
    </div>

    <UStepper v-model="active" :items="steps" />

    <UCard class="space-y-4">
      <template v-if="active === 0">
        <h2 class="text-lg font-semibold">
          Shipping address
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UInput placeholder="Full name" />
          <UInput placeholder="Phone" />
          <UInput placeholder="City" />
          <UInput placeholder="Country" />
          <UTextarea class="md:col-span-2" placeholder="Street address" />
        </div>
        <div class="flex justify-end">
          <UButton color="primary" @click="active = 1">
            Continue to payment
          </UButton>
        </div>
      </template>

      <template v-else-if="active === 1">
        <h2 class="text-lg font-semibold">
          Payment
        </h2>
        <URadioGroup
          :options="[
            { label: 'Paymob Card', value: 'paymob' },
            { label: 'Cash on Delivery', value: 'cash' }
          ]"
          value="paymob"
        />
        <div class="flex justify-between">
          <UButton variant="ghost" @click="active = 0">
            Back
          </UButton>
          <UButton color="primary" @click="active = 2">
            Review order
          </UButton>
        </div>
      </template>

      <template v-else>
        <h2 class="text-lg font-semibold">
          Review
        </h2>
        <p class="text-muted">
          Order summary and Paymob redirect placeholder.
        </p>
        <div class="flex justify-between">
          <UButton variant="ghost" @click="active = 1">
            Back
          </UButton>
          <UButton color="primary">
            Place order
          </UButton>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
