<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { CategoryTreeNode } from '~/types'
import { flattenCategoryTree } from '~/utils/categories'

const props = defineProps<{
  open: boolean
  categories: CategoryTreeNode[]
  submitting?: boolean
}>()

const emit = defineEmits(['update:open', 'submit'] as const)

const schema = z.object({
  nameEn: z.string().trim().min(1, 'Enter a category name'),
  parentId: z.number().int().positive().nullable().optional()
})

const state = reactive({
  nameEn: '',
  parentId: null as number | null
})

const parentOptions = computed(() => {
  const flattened = flattenCategoryTree(props.categories ?? [])

  return [
    { label: 'Top-level category', value: null },
    ...flattened.map(category => ({
      label: category.path,
      value: category.id
    }))
  ]
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      return
    }

    if (!props.submitting) {
      resetForm()
    }
  }
)

function handleSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  emit('submit', {
    nameEn: typeof event.data.nameEn === 'string' ? event.data.nameEn.trim() : '',
    parentId: typeof event.data.parentId === 'number' && Number.isFinite(event.data.parentId)
      ? event.data.parentId
      : null
  })
}

function resetForm() {
  state.nameEn = ''
  state.parentId = null
}

function closeModal() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    title="Quick category"
    description="Create a nested category without leaving the current flow."
    :ui="{ content: 'sm:max-w-sm' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="handleSubmit"
      >
        <UFormField label="Category name" name="nameEn">
          <UInput v-model="state.nameEn" placeholder="Accessories" class="w-full" />
        </UFormField>

        <UFormField label="Parent category" name="parentId">
          <USelect v-model="state.parentId" :items="parentOptions" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="submitting"
            @click.prevent="closeModal"
          />
          <UButton
            type="submit"
            label="Create"
            icon="i-lucide-plus"
            :loading="submitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
