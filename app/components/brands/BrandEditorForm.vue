<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { BrandEditorValues } from '~/types'
import S3ImageUploader from '~/components/media/S3ImageUploader.vue'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialValues?: Partial<BrandEditorValues>
  submitting?: boolean
  open?: boolean
}>()

const emit = defineEmits<{ (e: 'submit', values: BrandEditorValues): void }>()

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

const schema = z.object({
  nameEn: z.string().trim().min(1, 'Enter a brand name'),
  nameAr: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  logo: z.string().url('Provide a valid URL').optional().or(z.literal('').transform(() => undefined)),
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
  logo: props.initialValues?.logo ?? '',
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

const logoImages = ref<string[]>(state.logo ? [state.logo] : [])
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
      logo: next.logo ?? '',
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
    logoImages.value = state.logo ? [state.logo] : []
  },
  { deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (open && props.mode === 'create') resetState()
    if (!open && !props.submitting) resetState()
  }
)

function resetState() {
  Object.assign(state, {
    nameEn: props.initialValues?.nameEn ?? '',
    nameAr: props.initialValues?.nameAr ?? '',
    descriptionEn: props.initialValues?.descriptionEn ?? '',
    descriptionAr: props.initialValues?.descriptionAr ?? '',
    logo: props.initialValues?.logo ?? '',
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
  logoImages.value = state.logo ? [state.logo] : []
}

watch(() => state.logo, (logo) => {
  const current = logoImages.value[0] ?? ''
  if (!logo && logoImages.value.length > 0) {
    logoImages.value = []
    return
  }
  if (logo && logo !== current) {
    logoImages.value = [logo]
  }
})

watch(logoImages, (next) => {
  const [first] = next ?? []
  if ((first ?? '') !== state.logo) {
    state.logo = first ?? ''
  }
}, { deep: true })

function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  emit('submit', {
    nameEn: state.nameEn,
    nameAr: state.nameAr || undefined,
    descriptionEn: state.descriptionEn || undefined,
    descriptionAr: state.descriptionAr || undefined,
    logo: state.logo || null,
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
      <UFormField label="Brand name (English)" name="nameEn">
        <UInput v-model="state.nameEn" placeholder="Acme" class="w-full" />
      </UFormField>

      <UFormField label="Brand name (Arabic)" name="nameAr">
        <UInput
          v-model="state.nameAr"
          placeholder="اسم العلامة التجارية"
          dir="rtl"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Logo -->
    <UFormField label="Brand logo" name="logo">
      <div class="space-y-3">
        <S3ImageUploader v-model="logoImages" single-mode placeholder-class="text-xs text-muted" />
        <UInput v-model="state.logo" placeholder="Paste an existing logo URL" class="w-full" />
      </div>
    </UFormField>

    <!-- Description -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Description (English)" name="descriptionEn">
        <UTextarea
          v-model="state.descriptionEn"
          placeholder="Brand description..."
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Description (Arabic)" name="descriptionAr">
        <UTextarea
          v-model="state.descriptionAr"
          placeholder="وصف العلامة التجارية..."
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
      :label="mode === 'edit' ? 'Update brand' : 'Create brand'"
      :loading="submitting"
    />
  </UForm>
</template>
