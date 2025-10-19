<script setup lang="ts">
import type { BrandEditorValues } from '~/types'
import BrandEditorForm from '~/components/brands/BrandEditorForm.vue'

defineProps<{
  open: boolean
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'submit', values: BrandEditorValues): void
}>()

function handleSubmit(values: BrandEditorValues) {
  emit('submit', values)
}

function handleOpenChange(next: boolean) {
  emit('update:open', next)
}
</script>

<template>
  <UModal
    :open="open"
    title="Quick brand"
    description="Create a brand without leaving the product flow."
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="handleOpenChange"
  >
    <template #body>
      <BrandEditorForm
        mode="create"
        :open="open"
        :submitting="submitting"
        @submit="handleSubmit"
      />
    </template>
  </UModal>
</template>
