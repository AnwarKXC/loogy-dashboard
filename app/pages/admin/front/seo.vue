<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { TableColumn } from '@nuxt/ui'
import { h } from 'vue'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const toast = useToast()

const MAX_SEO_TITLE_LENGTH = 70
const MAX_SEO_DESCRIPTION_LENGTH = 160

// Available page keys
const pageOptions = [
  { label: 'Home Page', value: 'home' },
  { label: 'Products Page', value: 'products' },
  { label: 'Categories Page', value: 'categories' },
  { label: 'Cart', value: 'cart' },
  { label: 'Checkout', value: 'checkout' },
  { label: 'Wishlist', value: 'wishlist' },
  { label: 'Search', value: 'search' },
  { label: 'About', value: 'about' },
  { label: 'Contact', value: 'contact' }
]

const langOptions = [
  { label: 'English', value: 'EN' },
  { label: 'Arabic', value: 'AR' }
]

const seoSchema = z.object({
  pageKey: z.string().min(1, 'Page is required'),
  lang: z.enum(['EN', 'AR']),
  title: z.string().min(1, 'Title is required').max(MAX_SEO_TITLE_LENGTH),
  description: z.string().max(MAX_SEO_DESCRIPTION_LENGTH).default(''),
  keywords: z.string().default(''),
  ogTitle: z.string().max(MAX_SEO_TITLE_LENGTH).default(''),
  ogDescription: z.string().max(200).default(''),
  ogImage: z.string().default(''),
  canonicalUrl: z.string().default(''),
  robots: z.string().default('index, follow')
})

type SeoFormState = z.infer<typeof seoSchema>
type PageSEO = SeoFormState & { id: number }

const { data, status, refresh } = await useFetch<{ pages: Record<string, Record<string, PageSEO>>, total: number }>('/api/seo/pages')

const pages = computed(() => {
  if (!data.value?.pages) return []

  const result: PageSEO[] = []
  for (const [pageKey, langs] of Object.entries(data.value.pages)) {
    for (const [lang, seo] of Object.entries(langs)) {
      result.push({ ...seo, pageKey, lang: lang as 'EN' | 'AR' })
    }
  }
  return result.sort((a, b) => a.pageKey.localeCompare(b.pageKey) || a.lang.localeCompare(b.lang))
})

const createOpen = ref(false)
const editOpen = ref(false)
const deleteOpen = ref(false)
const formLoading = ref(false)
const deleteLoading = ref(false)

const selectedSEO = ref<PageSEO | null>(null)

const state = reactive({
  pageKey: '',
  lang: 'EN' as 'EN' | 'AR',
  title: '',
  description: '',
  keywords: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonicalUrl: '',
  robots: 'index, follow'
})

function resetState() {
  Object.assign(state, {
    pageKey: '',
    lang: 'EN',
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: '',
    robots: 'index, follow'
  })
}

function openCreate() {
  resetState()
  selectedSEO.value = null
  createOpen.value = true
}

function openEdit(seo: PageSEO) {
  selectedSEO.value = seo
  Object.assign(state, {
    pageKey: seo.pageKey,
    lang: seo.lang,
    title: seo.title ?? '',
    description: seo.description ?? '',
    keywords: seo.keywords ?? '',
    ogTitle: seo.ogTitle ?? '',
    ogDescription: seo.ogDescription ?? '',
    ogImage: seo.ogImage ?? '',
    canonicalUrl: seo.canonicalUrl ?? '',
    robots: seo.robots ?? 'index, follow'
  })
  editOpen.value = true
}

function openDelete(seo: PageSEO) {
  selectedSEO.value = seo
  deleteOpen.value = true
}

async function handleSubmit(_event: FormSubmitEvent<SeoFormState>) {
  formLoading.value = true

  try {
    await $fetch('/api/seo/pages', {
      method: 'POST',
      body: {
        pageKey: state.pageKey,
        lang: state.lang,
        title: state.title,
        description: state.description || null,
        keywords: state.keywords || null,
        ogTitle: state.ogTitle || null,
        ogDescription: state.ogDescription || null,
        ogImage: state.ogImage || null,
        canonicalUrl: state.canonicalUrl || null,
        robots: state.robots || null
      }
    })

    toast.add({
      title: selectedSEO.value ? 'SEO Updated' : 'SEO Created',
      description: `SEO for ${state.pageKey} (${state.lang}) saved successfully.`
    })

    createOpen.value = false
    editOpen.value = false
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save SEO settings'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    formLoading.value = false
  }
}

async function confirmDelete() {
  if (!selectedSEO.value) return

  deleteLoading.value = true

  try {
    await $fetch(`/api/seo/pages/${selectedSEO.value.pageKey}?lang=${selectedSEO.value.lang}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Deleted',
      description: `SEO for ${selectedSEO.value.pageKey} (${selectedSEO.value.lang}) was removed.`
    })

    deleteOpen.value = false
    selectedSEO.value = null
    await refresh()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    deleteLoading.value = false
  }
}

const columns: TableColumn<PageSEO>[] = [
  {
    accessorKey: 'pageKey',
    header: 'Page',
    cell: ({ row }) => h('span', { class: 'font-medium capitalize' }, row.original.pageKey)
  },
  {
    accessorKey: 'lang',
    header: 'Language',
    cell: ({ row }) => h(UBadge, { variant: 'subtle', color: row.original.lang === 'EN' ? 'primary' : 'warning' }, () => row.original.lang)
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => h('span', { class: 'text-sm truncate max-w-[200px] block' }, row.original.title)
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted truncate max-w-[200px] block' }, row.original.description ?? '-')
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, {
        icon: 'i-lucide-pencil',
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        onClick: () => openEdit(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-trash-2',
        color: 'error',
        variant: 'ghost',
        size: 'xs',
        onClick: () => openDelete(row.original)
      })
    ])
  }
]

const getPageLabel = (key: string) => pageOptions.find(p => p.value === key)?.label ?? key
</script>

<template>
  <div class="space-y-6 p-4 -mt-6">
    <UCard>
      <template #header>
        <div>
          <p class="text-sm text-muted">
            Manage SEO settings for your storefront pages
          </p>
          <h2 class="text-lg font-semibold">
            SEO Settings
          </h2>
        </div>
      </template>

      <div class="flex items-center justify-end gap-4 ">
        <UButton
          icon="i-lucide-plus"
          label="Add SEO"
          @click="openCreate"
        />
      </div>
      <USkeleton
        v-if="status === 'pending'"
        class="h-64"
      />
      <UTable
        v-else
        :data="pages"
        :columns="columns"
      />
    </UCard>
  </div>

  <!-- Create Modal -->
  <UModal v-model:open="createOpen" title="Add Page SEO">
    <template #body>
      <UForm
        :schema="seoSchema"
        :state="state"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Page"
            name="pageKey"
          >
            <USelect
              v-model="state.pageKey"
              :items="pageOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Language"
            name="lang"
          >
            <USelect
              v-model="state.lang"
              :items="langOptions"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Title"
          name="title"
          :hint="`${state.title.length}/${MAX_SEO_TITLE_LENGTH}`"
        >
          <UInput
            v-model="state.title"
            placeholder="Page title for search engines"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
          :hint="`${state.description.length}/${MAX_SEO_DESCRIPTION_LENGTH}`"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Meta description..."
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Keywords"
          name="keywords"
        >
          <UInput
            v-model="state.keywords"
            placeholder="keyword1, keyword2, keyword3"
            class="w-full"
          />
        </UFormField>

        <UDivider label="Open Graph" />

        <UFormField
          label="OG Title"
          name="ogTitle"
        >
          <UInput
            v-model="state.ogTitle"
            placeholder="Title for social sharing"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="OG Description"
          name="ogDescription"
        >
          <UTextarea
            v-model="state.ogDescription"
            placeholder="Description for social sharing"
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="OG Image URL"
          name="ogImage"
        >
          <UInput
            v-model="state.ogImage"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UDivider label="Advanced" />

        <UFormField
          label="Canonical URL"
          name="canonicalUrl"
        >
          <UInput
            v-model="state.canonicalUrl"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Robots"
          name="robots"
        >
          <UInput
            v-model="state.robots"
            placeholder="index, follow"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="createOpen = false">
          Cancel
        </UButton>
        <UButton
          icon="i-lucide-save"
          label="Save SEO"
          :loading="formLoading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>

  <!-- Edit Modal -->
  <UModal v-model:open="editOpen" title="Edit Page SEO">
    <template #body>
      <UForm
        :schema="seoSchema"
        :state="state"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Page"
            name="pageKey"
          >
            <USelect
              v-model="state.pageKey"
              :items="pageOptions"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Language"
            name="lang"
          >
            <USelect
              v-model="state.lang"
              :items="langOptions"
              disabled
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Title"
          name="title"
          :hint="`${state.title.length}/${MAX_SEO_TITLE_LENGTH}`"
        >
          <UInput
            v-model="state.title"
            placeholder="Page title for search engines"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
          :hint="`${state.description.length}/${MAX_SEO_DESCRIPTION_LENGTH}`"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Meta description..."
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Keywords"
          name="keywords"
        >
          <UInput
            v-model="state.keywords"
            placeholder="keyword1, keyword2, keyword3"
            class="w-full"
          />
        </UFormField>

        <UDivider label="Open Graph" />

        <UFormField
          label="OG Title"
          name="ogTitle"
        >
          <UInput
            v-model="state.ogTitle"
            placeholder="Title for social sharing"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="OG Description"
          name="ogDescription"
        >
          <UTextarea
            v-model="state.ogDescription"
            placeholder="Description for social sharing"
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="OG Image URL"
          name="ogImage"
        >
          <UInput
            v-model="state.ogImage"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UDivider label="Advanced" />

        <UFormField
          label="Canonical URL"
          name="canonicalUrl"
        >
          <UInput
            v-model="state.canonicalUrl"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Robots"
          name="robots"
        >
          <UInput
            v-model="state.robots"
            placeholder="index, follow"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="editOpen = false">
          Cancel
        </UButton>
        <UButton
          icon="i-lucide-save"
          label="Update SEO"
          :loading="formLoading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>

  <!-- Delete Confirmation -->
  <UModal v-model:open="deleteOpen" title="Delete SEO Settings">
    <template #body>
      <p class="text-sm text-muted">
        Are you sure you want to delete SEO settings for
        <strong class="text-highlighted">{{ getPageLabel(selectedSEO?.pageKey ?? '') }} ({{ selectedSEO?.lang }})</strong>?
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="deleteOpen = false"
        />
        <UButton
          color="error"
          label="Delete"
          :loading="deleteLoading"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
