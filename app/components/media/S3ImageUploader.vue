<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  initialImages?: string[]
  uploadEndpoint?: string
  singleMode?: boolean
  errorMessage?: string
  placeholderClass?: string
}>(), {
  initialImages: () => [] as string[],
  uploadEndpoint: '/api/file-upload',
  singleMode: false,
  errorMessage: '',
  placeholderClass: 'text-sm text-muted'
})

const emit = defineEmits<{
  (e: 'update:images' | 'uploadSuccess', urls: string[]): void
  (e: 'uploadError', error: unknown): void
}>()

const model = defineModel<string[]>({ default: () => [] })

const images = ref<string[]>([])
const isUploading = ref(false)
const dragActive = ref(false)
const uploadError = ref<string | null>(null)
const draggingIndex = ref<number | null>(null)
const filesCompleted = ref(0)
const currentFileIndex = ref(0)
const uploadTotalFiles = ref(0)
const uploadProgress = ref(0)

const currentImage = computed(() => (props.singleMode ? images.value[0] ?? null : null))
const displayedError = computed(() => uploadError.value || props.errorMessage || '')
const uploadLabel = computed(() => {
  if (!isUploading.value) {
    return ''
  }

  if (uploadTotalFiles.value === 0) {
    return 'Preparing upload...'
  }

  if (filesCompleted.value >= uploadTotalFiles.value) {
    return 'Finalizing upload...'
  }

  const inFlight = Math.min(currentFileIndex.value + 1, uploadTotalFiles.value)
  return `Uploading file ${inFlight} of ${uploadTotalFiles.value}`
})

function normalizeImages(value: string[]): string[] {
  if (props.singleMode) {
    const [first] = value
    return first ? [first] : []
  }

  return value
}

function setImages(next: string[]) {
  const normalized = normalizeImages(next)
  images.value = normalized
  model.value = [...normalized]
  emit('update:images', [...normalized])
}

watch(() => model.value, (next) => {
  const normalized = Array.isArray(next) ? normalizeImages([...next]) : []
  images.value = normalized
}, { immediate: true, deep: true })

onMounted(() => {
  if (images.value.length === 0 && props.initialImages.length > 0) {
    setImages([...props.initialImages])
  }
})

watch(() => props.initialImages, (next) => {
  if (!next || next.length === 0) {
    return
  }

  if (model.value.length === 0) {
    setImages([...next])
  }
}, { deep: true })

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragActive.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragActive.value = false
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragActive.value = false

  const files = event.dataTransfer?.files
  if (files?.length) {
    await processFiles(files)
  }
}

async function handleFileChange(event: Event) {
  const files = (event.target as HTMLInputElement)?.files

  if (files?.length) {
    await processFiles(files)
    ;(event.target as HTMLInputElement).value = ''
  }
}

async function processFiles(fileList: FileList | File[]) {
  uploadError.value = null

  const files = Array.from(fileList).filter(file => file.type.startsWith('image/'))
  if (!files.length) {
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  filesCompleted.value = 0
  currentFileIndex.value = 0
  uploadTotalFiles.value = files.length

  try {
    const allLinks: string[] = []

    for (const [index, file] of files.entries()) {
      currentFileIndex.value = index
      const links = await uploadSingleFile(file)

      if (!links.length) {
        continue
      }

      allLinks.push(...links)
      filesCompleted.value = index + 1
      uploadProgress.value = Math.round((filesCompleted.value / uploadTotalFiles.value) * 100)
    }

    if (!allLinks.length) {
      throw new Error('Upload did not return any file URLs')
    }

    if (props.singleMode) {
      const [firstLink] = allLinks
      if (!firstLink) {
        throw new Error('Upload did not return any file URLs')
      }
      setImages([firstLink])
    } else {
      const next = [...images.value]
      for (const link of allLinks) {
        if (!next.includes(link)) {
          next.push(link)
        }
      }
      setImages(next)
    }

    emit('uploadSuccess', allLinks)
  } catch (error) {
    console.error('Error uploading images:', error)
    uploadError.value = error instanceof Error ? error.message : 'Failed to upload images.'
    emit('uploadError', error)
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
      filesCompleted.value = 0
      currentFileIndex.value = 0
      uploadTotalFiles.value = 0
    }, 600)
  }
}

async function uploadSingleFile(file: File): Promise<string[]> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await $fetch<{ links?: string[] }>(props.uploadEndpoint, {
    method: 'POST',
    body: formData
  })

  const links = Array.isArray(response?.links)
    ? response.links.filter((link): link is string => typeof link === 'string' && link.length > 0)
    : []

  return links
}

function removeImage(index: number) {
  if (props.singleMode) {
    setImages([])
    return
  }

  const next = [...images.value]
  next.splice(index, 1)
  setImages(next)
}

function onImageDragStart(index: number) {
  draggingIndex.value = index
}

function onImageDragEnter(index: number) {
  if (draggingIndex.value === null || draggingIndex.value === index) {
    return
  }

  const next = [...images.value]
  const [moved] = next.splice(draggingIndex.value, 1)
  if (!moved) {
    return
  }
  next.splice(index, 0, moved)
  draggingIndex.value = index
  setImages(next)
}

function onImageDragEnd() {
  draggingIndex.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div
      class="relative overflow-hidden rounded-2xl border border-dashed p-6 transition-colors duration-200"
      :class="{
        'border-error-500/80 bg-error-50/60 dark:bg-error-500/10': displayedError,
        'border-primary-400 bg-gradient-to-br from-primary-50 via-white to-primary-100 shadow-lg shadow-primary-200/30': dragActive && !displayedError,
        'border-default-300 bg-white/60 backdrop-blur-sm dark:border-default-600 dark:bg-slate-900/40': !dragActive && !displayedError
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div
        v-if="isUploading"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90"
      >
        <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary-500" />
        <div class="w-56 space-y-2 text-center">
          <UProgress
            :value="uploadProgress"
            size="md"
            color="primary"
            class="w-full"
          />
          <div class="text-sm font-medium text-primary-600 dark:text-primary-300">
            {{ uploadLabel || 'Uploading...' }}
          </div>
          <p class="text-xs text-muted">
            Hold tight while we sync
            <template v-if="uploadTotalFiles">
              {{ uploadTotalFiles }} {{ uploadTotalFiles === 1 ? 'file' : 'files' }}
            </template>
            <template v-else>
              your images
            </template>
            .
          </p>
        </div>
      </div>

      <div
        class="relative z-10 flex flex-col items-center gap-4 text-center"
        :class="{ 'pointer-events-none opacity-30 blur-[0.5px]': isUploading }"
      >
        <div class="flex size-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-200">
          <UIcon name="i-lucide-images" class="size-8" />
        </div>
        <div class="space-y-2">
          <p class="text-base font-semibold text-foreground">
            Drag & drop {{ singleMode ? 'an image' : 'images' }} or browse your device
          </p>
          <p :class="['mx-auto max-w-2xl text-sm leading-relaxed', props.placeholderClass]">
            Supports transparent PNG, JPG and WEBP up to your plan limit. You can reorder images after uploading.
          </p>
        </div>

        <label
          v-if="singleMode ? !currentImage : true"
          class="inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
        >
          <UIcon name="i-lucide-upload" class="size-4" />
          <span>{{ singleMode ? 'Upload image' : 'Upload images' }}</span>
          <input
            type="file"
            :multiple="!singleMode"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          >
        </label>

        <div class="flex items-center gap-2 text-xs text-muted">
          <UIcon name="i-lucide-mouse-pointer-click" class="size-4" />
          <span>Drag to reorder after upload.</span>
        </div>
      </div>

      <div
        class="pointer-events-none absolute inset-0 rounded-2xl"
        :class="{
          'bg-primary-100/30 dark:bg-primary-500/20': dragActive,
          'bg-transparent': !dragActive
        }"
      />

      <div v-if="displayedError" class="absolute inset-x-6 bottom-6 text-left text-sm text-error">
        {{ displayedError }}
      </div>
    </div>

    <div v-if="singleMode && currentImage" class="relative overflow-hidden rounded-2xl border border-default-200 shadow-sm dark:border-default-700">
      <img :src="currentImage" alt="Uploaded image" class="h-full w-full object-cover">
      <button
        class="absolute end-3 top-3 flex size-9 aspect-square items-center justify-center rounded-full bg-error-500 text-white shadow-sm transition hover:bg-error-600 cursor-pointer"
        @click.prevent="removeImage(0)"
      >
        <UIcon name="i-lucide-x" class="size-4 " />
      </button>
    </div>

    <div v-else-if="!singleMode && images.length" class="flex flex-wrap gap-x-4 gap-y-8 ">
      <div
        v-for="(image, index) in images"
        :key="image"
        :class="[
          'group relative aspect-square overflow-hidden rounded-2xl shadow bg-white  transition-all sm:size-48 size-40 drop-shadow-primary-500 duration-500 hover:drop-shadow-xs dark:bg-slate-900/60',
          draggingIndex === index ? 'ring-4 ring-primary-400' : ''
        ]"
        draggable="true"
        @dragstart="onImageDragStart(index)"
        @dragenter.prevent="onImageDragEnter(index)"
        @dragover.prevent
        @dragend="onImageDragEnd"
      >
        <img :src="image" alt="Uploaded image" class="h-full w-full object-cover transition duration-300  overflow-hidden">
        <span v-if="index === 0" class="absolute text-white rounded-2xl z-10 top-0 bg-primary-800/70 px-2 py-1 m-1">cover</span>
        <div class="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 via-black/20 to-transparent p-2 text-xs text-white">
          <span class="flex items-center gap-2 truncate">
            <span class="truncate">{{ image }}</span>
          </span>
          <button
            class="inline-flex size-8 items-center justify-center rounded-full bg-error-500/90 text-white shadow transition hover:bg-error-600 aspect-square cursor-pointer"
            @click.prevent="removeImage(index)"
          >
            <UIcon name="i-lucide-trash-2" class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <p
      v-else-if="images.length === 0"
      class="text-sm text-muted"
    >
      No images yet. Upload to start building the gallery.
    </p>
  </div>
</template>
