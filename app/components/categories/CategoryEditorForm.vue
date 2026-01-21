<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { CategoryEditorValues, CategoryTreeNode } from '~/types'
import { flattenCategoryTree } from '~/utils/categories'
import S3ImageUploader from '~/components/media/S3ImageUploader.vue'

const props = defineProps<{
  mode: 'create' | 'edit'
  categories: CategoryTreeNode[]
  initialValues?: Partial<CategoryEditorValues>
  submitting?: boolean
  disabledCategoryIds?: number[]
  open?: boolean
}>()

const emit = defineEmits<{ (e: 'submit', values: CategoryEditorValues): void }>()

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

const schema = z.object({
  nameEn: z.string().trim().min(1, 'Enter a category name'),
  nameAr: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  image: z.string().url().optional().nullable(),
  // SEO fields
  seoTitleEn: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  seoTitleAr: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  seoDescriptionEn: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH).optional(),
  seoDescriptionAr: z.string().trim().max(MAX_SEO_DESCRIPTION_LENGTH).optional(),
  seoKeywordsEn: z.string().trim().optional(),
  seoKeywordsAr: z.string().trim().optional(),
  ogTitleEn: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  ogTitleAr: z.string().trim().max(MAX_SEO_TITLE_LENGTH).optional(),
  ogDescriptionEn: z.string().trim().max(200).optional(),
  ogDescriptionAr: z.string().trim().max(200).optional()
})

const state = reactive({
  nameEn: props.initialValues?.nameEn ?? '',
  nameAr: props.initialValues?.nameAr ?? '',
  descriptionEn: props.initialValues?.descriptionEn ?? '',
  descriptionAr: props.initialValues?.descriptionAr ?? '',
  parentId: props.initialValues?.parentId ?? null,
  image: props.initialValues?.image ?? '',
  // SEO fields
  seoTitleEn: props.initialValues?.seoTitleEn ?? '',
  seoTitleAr: props.initialValues?.seoTitleAr ?? '',
  seoDescriptionEn: props.initialValues?.seoDescriptionEn ?? '',
  seoDescriptionAr: props.initialValues?.seoDescriptionAr ?? '',
  seoKeywordsEn: props.initialValues?.seoKeywordsEn ?? '',
  seoKeywordsAr: props.initialValues?.seoKeywordsAr ?? '',
  ogTitleEn: props.initialValues?.ogTitleEn ?? '',
  ogTitleAr: props.initialValues?.ogTitleAr ?? '',
  ogDescriptionEn: props.initialValues?.ogDescriptionEn ?? '',
  ogDescriptionAr: props.initialValues?.ogDescriptionAr ?? ''
})

const imageArray = ref<string[]>(state.image ? [state.image] : [])
const showSeoFields = ref(false)

watch(
  () => props.initialValues,
  (next) => {
    if (!next) return
    Object.assign(state, {
      nameEn: next.nameEn ?? '',
      nameAr: next.nameAr ?? '',
      descriptionEn: next.descriptionEn ?? '',
      descriptionAr: next.descriptionAr ?? '',
      parentId: next.parentId ?? null,
      image: next.image ?? '',
      seoTitleEn: next.seoTitleEn ?? '',
      seoTitleAr: next.seoTitleAr ?? '',
      seoDescriptionEn: next.seoDescriptionEn ?? '',
      seoDescriptionAr: next.seoDescriptionAr ?? '',
      seoKeywordsEn: next.seoKeywordsEn ?? '',
      seoKeywordsAr: next.seoKeywordsAr ?? '',
      ogTitleEn: next.ogTitleEn ?? '',
      ogTitleAr: next.ogTitleAr ?? '',
      ogDescriptionEn: next.ogDescriptionEn ?? '',
      ogDescriptionAr: next.ogDescriptionAr ?? ''
    })
    imageArray.value = state.image ? [state.image] : []
  },
  { deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (!open && !props.submitting) resetState()
    if (open && props.mode === 'create') resetState()
  }
)

function resetState() {
  Object.assign(state, {
    nameEn: props.initialValues?.nameEn ?? '',
    nameAr: props.initialValues?.nameAr ?? '',
    descriptionEn: props.initialValues?.descriptionEn ?? '',
    descriptionAr: props.initialValues?.descriptionAr ?? '',
    parentId: props.initialValues?.parentId ?? null,
    image: props.initialValues?.image ?? '',
    seoTitleEn: props.initialValues?.seoTitleEn ?? '',
    seoTitleAr: props.initialValues?.seoTitleAr ?? '',
    seoDescriptionEn: props.initialValues?.seoDescriptionEn ?? '',
    seoDescriptionAr: props.initialValues?.seoDescriptionAr ?? '',
    seoKeywordsEn: props.initialValues?.seoKeywordsEn ?? '',
    seoKeywordsAr: props.initialValues?.seoKeywordsAr ?? '',
    ogTitleEn: props.initialValues?.ogTitleEn ?? '',
    ogTitleAr: props.initialValues?.ogTitleAr ?? '',
    ogDescriptionEn: props.initialValues?.ogDescriptionEn ?? '',
    ogDescriptionAr: props.initialValues?.ogDescriptionAr ?? ''
  })
  imageArray.value = state.image ? [state.image] : []
}

watch(imageArray, (next) => {
  state.image = next[0] ?? ''
}, { deep: true })

watch(() => state.image, (val) => {
  if ((val ?? '') !== (imageArray.value[0] ?? '')) {
    imageArray.value = val ? [val] : []
  }
})

const parentOptions = computed(() => {
  const flattened = flattenCategoryTree(props.categories ?? [])
  const disabled = new Set(props.disabledCategoryIds ?? [])

  return [
    { label: 'Top-level category', value: null },
    ...flattened
      .filter(item => !disabled.has(item.id))
      .map(item => ({ label: item.path, value: item.id }))
  ]
})

function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  emit('submit', {
    nameEn: state.nameEn,
    nameAr: state.nameAr || undefined,
    descriptionEn: state.descriptionEn || undefined,
    descriptionAr: state.descriptionAr || undefined,
    parentId: state.parentId,
    image: state.image || null,
    seoTitleEn: state.seoTitleEn || undefined,
    seoTitleAr: state.seoTitleAr || undefined,
    seoDescriptionEn: state.seoDescriptionEn || undefined,
    seoDescriptionAr: state.seoDescriptionAr || undefined,
    seoKeywordsEn: state.seoKeywordsEn || undefined,
    seoKeywordsAr: state.seoKeywordsAr || undefined,
    ogTitleEn: state.ogTitleEn || undefined,
    ogTitleAr: state.ogTitleAr || undefined,
    ogDescriptionEn: state.ogDescriptionEn || undefined,
    ogDescriptionAr: state.ogDescriptionAr || undefined
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
    <!-- Basic Info -->
    <div class="grid gap-4 sm:grid-cols-2">
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
    </div>

    <UFormField label="Parent category" name="parentId">
      <USelect v-model="state.parentId" :items="parentOptions" class="w-full" />
    </UFormField>

    <!-- Image -->
    <UFormField label="Category image" name="image">
      <S3ImageUploader v-model="imageArray" single-mode />
    </UFormField>

    <!-- Description -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Description (English)" name="descriptionEn">
        <UTextarea
          v-model="state.descriptionEn"
          placeholder="Category description..."
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Description (Arabic)" name="descriptionAr">
        <UTextarea
          v-model="state.descriptionAr"
          placeholder="وصف الفئة..."
          dir="rtl"
          :rows="3"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- SEO Section Toggle -->
    <UButton
      type="button"
      variant="ghost"
      color="neutral"
      :icon="showSeoFields ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
      :label="showSeoFields ? 'Hide SEO settings' : 'Show SEO settings'"
      @click="showSeoFields = !showSeoFields"
    />

    <template v-if="showSeoFields">
      <UDivider label="SEO Settings" />

      <!-- SEO Title -->
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="SEO Title (English)" name="seoTitleEn" :hint="`${state.seoTitleEn.length}/${MAX_SEO_TITLE_LENGTH}`">
          <UInput v-model="state.seoTitleEn" placeholder="SEO title for search engines" class="w-full" />
        </UFormField>

        <UFormField label="SEO Title (Arabic)" name="seoTitleAr" :hint="`${state.seoTitleAr.length}/${MAX_SEO_TITLE_LENGTH}`">
          <UInput
            v-model="state.seoTitleAr"
            placeholder="عنوان SEO"
            dir="rtl"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- SEO Description -->
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="SEO Description (English)" name="seoDescriptionEn" :hint="`${state.seoDescriptionEn.length}/${MAX_SEO_DESCRIPTION_LENGTH}`">
          <UTextarea
            v-model="state.seoDescriptionEn"
            placeholder="Meta description..."
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <UFormField label="SEO Description (Arabic)" name="seoDescriptionAr" :hint="`${state.seoDescriptionAr.length}/${MAX_SEO_DESCRIPTION_LENGTH}`">
          <UTextarea
            v-model="state.seoDescriptionAr"
            placeholder="وصف ميتا..."
            dir="rtl"
            :rows="2"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- SEO Keywords -->
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="SEO Keywords (English)" name="seoKeywordsEn">
          <UInput v-model="state.seoKeywordsEn" placeholder="keyword1, keyword2, keyword3" class="w-full" />
        </UFormField>

        <UFormField label="SEO Keywords (Arabic)" name="seoKeywordsAr">
          <UInput
            v-model="state.seoKeywordsAr"
            placeholder="كلمة1، كلمة2، كلمة3"
            dir="rtl"
            class="w-full"
          />
        </UFormField>
      </div>

      <UDivider label="Open Graph (Social Media)" />

      <!-- OG Title -->
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="OG Title (English)" name="ogTitleEn">
          <UInput v-model="state.ogTitleEn" placeholder="Title for social sharing" class="w-full" />
        </UFormField>

        <UFormField label="OG Title (Arabic)" name="ogTitleAr">
          <UInput
            v-model="state.ogTitleAr"
            placeholder="عنوان للمشاركة"
            dir="rtl"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- OG Description -->
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="OG Description (English)" name="ogDescriptionEn">
          <UTextarea
            v-model="state.ogDescriptionEn"
            placeholder="Description for social sharing..."
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <UFormField label="OG Description (Arabic)" name="ogDescriptionAr">
          <UTextarea
            v-model="state.ogDescriptionAr"
            placeholder="وصف للمشاركة..."
            dir="rtl"
            :rows="2"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <UButton
      type="submit"
      size="lg"
      icon="i-lucide-save"
      :label="mode === 'edit' ? 'Update category' : 'Create category'"
      :loading="submitting"
    />
  </UForm>
</template>
