<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { CategoryEditorValues, CategoryTreeNode } from '~/types'
import { flattenCategoryTree } from '~/utils/categories'

const props = defineProps<{
  mode: 'create' | 'edit'
  categories: CategoryTreeNode[]
  initialValues?: Partial<CategoryEditorValues>
  submitting?: boolean
  disabledCategoryIds?: number[]
  open?: boolean
}>()

const emit = defineEmits<{ (e: 'submit', values: CategoryEditorValues): void }>()

const schema = z.object({
  nameEn: z.string().trim().min(1, 'Enter a category name'),
  nameAr: z.string().trim().optional(),
  parentId: z.number().int().positive().nullable().optional()
})

const state = reactive<CategoryEditorValues>({
  nameEn: props.initialValues?.nameEn ?? '',
  nameAr: props.initialValues?.nameAr ?? '',
  parentId: props.initialValues?.parentId ?? null
})

watch(
  () => props.initialValues,
  (next) => {
    if (!next) {
      return
    }

    state.nameEn = next.nameEn ?? ''
    state.nameAr = next.nameAr ?? ''
    state.parentId = next.parentId ?? null
  },
  { deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (!open && !props.submitting) {
      resetState()
    }

    if (open && props.mode === 'create') {
      resetState()
    }
  }
)

function resetState() {
  state.nameEn = props.initialValues?.nameEn ?? ''
  state.nameAr = props.initialValues?.nameAr ?? ''
  state.parentId = props.initialValues?.parentId ?? null
}

const initialNameAr = computed(() => props.initialValues?.nameAr ?? '')

const parentOptions = computed(() => {
  const flattened = flattenCategoryTree(props.categories ?? [])
  const disabled = new Set(props.disabledCategoryIds ?? [])

  return [
    { label: 'Top-level category', value: null },
    ...flattened
      .filter(item => !disabled.has(item.id))
      .map(item => ({
        label: item.path,
        value: item.id
      }))
  ]
})

function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const data = event.data

  const rawNameEn = typeof data.nameEn === 'string' ? data.nameEn : ''
  const rawNameAr = typeof data.nameAr === 'string' ? data.nameAr : ''
  const trimmedNameAr = rawNameAr.trim()

  const shouldIncludeNameAr = props.mode === 'create' || rawNameAr !== initialNameAr.value
  const submittedNameAr = shouldIncludeNameAr
    ? (trimmedNameAr.length > 0 ? trimmedNameAr : '')
    : undefined

  emit('submit', {
    nameEn: rawNameEn,
    nameAr: submittedNameAr,
    parentId: typeof data.parentId === 'number' && Number.isFinite(data.parentId) ? data.parentId : null
  })
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-6"
    @submit="onSubmit"
  >
    <UFormField label="Category name (English)" name="nameEn">
      <UInput v-model="state.nameEn" placeholder="New category" class="w-full" />
    </UFormField>

    <UFormField label="Category name (Arabic)" name="nameAr">
      <UInput
        v-model="state.nameAr"
        placeholder="اسم القسم"
        dir="rtl"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Parent category" name="parentId">
      <USelect v-model="state.parentId" :items="parentOptions" class="w-full" />
    </UFormField>

    <UButton
      type="submit"
      size="lg"
      icon="i-lucide-save"
      :label="mode === 'edit' ? 'Update category' : 'Create category'"
      :loading="submitting"
    />
  </UForm>
</template>
