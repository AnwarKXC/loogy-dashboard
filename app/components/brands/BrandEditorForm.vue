<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
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

const schema = z.object({
  nameEn: z.string().trim().min(1, 'Enter a brand name'),
  nameAr: z.string().trim().optional(),
  logo: z.string().url('Provide a valid URL').optional().or(z.literal('').transform(() => undefined))
})

const state = reactive({
  nameEn: props.initialValues?.nameEn ?? '',
  nameAr: props.initialValues?.nameAr ?? '',
  logo: props.initialValues?.logo ?? ''
})

const logoImages = ref<string[]>(state.logo ? [state.logo] : [])

const initialNameAr = computed(() => props.initialValues?.nameAr ?? '')

watch(
  () => props.initialValues,
  (next) => {
    if (!next) {
      return
    }

    state.nameEn = next.nameEn ?? ''
    state.nameAr = next.nameAr ?? ''
    state.logo = next.logo ?? ''
    logoImages.value = state.logo ? [state.logo] : []
  },
  { deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (open && props.mode === 'create') {
      resetState()
    }

    if (!open && !props.submitting) {
      resetState()
    }
  }
)

function resetState() {
  state.nameEn = props.initialValues?.nameEn ?? ''
  state.nameAr = props.initialValues?.nameAr ?? ''
  state.logo = props.initialValues?.logo ?? ''
  logoImages.value = state.logo ? [state.logo] : []
}

function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  const data = event.data

  const rawNameEn = typeof data.nameEn === 'string' ? data.nameEn : ''
  const rawNameAr = typeof data.nameAr === 'string' ? data.nameAr : ''
  const trimmedNameAr = rawNameAr.trim()
  const rawLogo = typeof data.logo === 'string' ? data.logo.trim() : ''

  const includeNameAr = props.mode === 'create' || rawNameAr !== initialNameAr.value
  const submittedNameAr = includeNameAr
    ? (trimmedNameAr.length > 0 ? trimmedNameAr : '')
    : undefined

  emit('submit', {
    nameEn: rawNameEn,
    nameAr: submittedNameAr,
    logo: rawLogo.length > 0 ? rawLogo : null
  })
}

watch(
  () => state.logo,
  (logo) => {
    const current = logoImages.value[0] ?? ''

    if (!logo && logoImages.value.length > 0) {
      logoImages.value = []
      return
    }

    if (logo && logo !== current) {
      logoImages.value = [logo]
    }
  }
)

watch(
  logoImages,
  (next) => {
    const [first] = next ?? []
    if ((first ?? '') !== state.logo) {
      state.logo = first ?? ''
    }
  },
  { deep: true }
)

function handleLogoUploadError(error: unknown) {
  console.error('Failed to upload brand logo:', error)
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-6"
    @submit="onSubmit"
  >
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

    <UFormField label="Brand logo" name="logo">
      <div class="space-y-3">
        <S3ImageUploader
          v-model="logoImages"
          single-mode
          placeholder-class="text-xs text-muted"
          @upload-error="handleLogoUploadError"
        />

        <UInput v-model="state.logo" placeholder="Paste an existing logo URL" class="w-full" />
        <p class="text-xs text-muted">
          Upload a logo or paste a hosted image URL. Uploaded images automatically populate the field.
        </p>
      </div>
    </UFormField>

    <UButton
      type="submit"
      size="lg"
      icon="i-lucide-save"
      :label="mode === 'edit' ? 'Update brand' : 'Create brand'"
      :loading="submitting"
    />
  </UForm>
</template>
