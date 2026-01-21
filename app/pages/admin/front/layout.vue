<script setup lang="ts">
import { FetchError } from 'ofetch'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const toast = useToast()

// Schema for nav links
const navLinkSchema = z.object({
  label: z.string(),
  to: z.string()
})

// Schema for footer links
const footerLinkSchema = z.object({
  label: z.string(),
  to: z.string()
})

// Schema for social links
const socialSchema = z.object({
  label: z.string(),
  icon: z.string(),
  url: z.string()
})

// Full layout schema
const layoutSchema = z.object({
  brand: z.object({
    name: z.string().default('Turkey Store'),
    logoUrl: z.string().nullable().optional(),
    homeUrl: z.string().default('/')
  }),
  navLinks: z.array(navLinkSchema).default([]),
  actions: z.object({
    showSearch: z.boolean().default(true),
    searchUrl: z.string().default('/search'),
    showWishlist: z.boolean().default(true),
    showCart: z.boolean().default(true),
    accountUrl: z.string().default('/admin/login')
  }),
  footer: z.object({
    copyright: z.string().default('© 2026 Loogy. All rights reserved.'),
    description: z.string().default('Fast e-commerce with dark mode support.'),
    links: z.array(footerLinkSchema).default([]),
    socials: z.array(socialSchema).default([])
  })
})

type LayoutData = z.infer<typeof layoutSchema>

const defaultData: LayoutData = {
  brand: {
    name: 'Turkey Store',
    logoUrl: null,
    homeUrl: '/'
  },
  navLinks: [
    { label: 'الرئيسية', to: '/' },
    { label: 'المنتجات', to: '/products' },
    { label: 'الفئات', to: '/categories' },
    { label: 'العروض', to: '/#deals' },
    { label: 'تواصل معنا', to: '/#contact' }
  ],
  actions: {
    showSearch: true,
    searchUrl: '/search',
    showWishlist: true,
    showCart: true,
    accountUrl: '/admin/login'
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Loogy. All rights reserved.`,
    description: 'Fast e-commerce with dark mode support.',
    links: [
      { label: 'Privacy Policy', to: '/pages/privacy-policy' },
      { label: 'Refund Policy', to: '/pages/refund-policy' },
      { label: 'Shipping', to: '/pages/shipping-policy' },
      { label: 'Terms & Conditions', to: '/pages/terms-and-conditions' }
    ],
    socials: [
      { label: 'Facebook', icon: 'i-lucide-facebook', url: '' },
      { label: 'Instagram', icon: 'i-lucide-instagram', url: '' },
      { label: 'YouTube', icon: 'i-lucide-youtube', url: '' }
    ]
  }
}

const state = reactive<LayoutData>(JSON.parse(JSON.stringify(defaultData)))

const saving = ref(false)

const { data, pending, refresh } = await useFetch('/api/superadmin/storefront/layout')

watch(
  () => data.value,
  (value) => {
    try {
      const raw = value?.content?.data ?? {}
      const parsed = layoutSchema.parse(raw)
      Object.assign(state, JSON.parse(JSON.stringify(parsed)))
    } catch {
      Object.assign(state, JSON.parse(JSON.stringify(defaultData)))
    }
  },
  { immediate: true }
)

function resolveErrorMessage(error: unknown) {
  if (error instanceof FetchError) {
    return error.data?.statusMessage || error.data?.message || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong'
}

async function handleSave(event: FormSubmitEvent<LayoutData>) {
  saving.value = true

  try {
    const validated = layoutSchema.parse(event.data)

    await $fetch('/api/superadmin/storefront/layout', {
      method: 'PATCH',
      body: { data: validated }
    })

    toast.add({
      title: 'Layout updated',
      color: 'success'
    })

    await refresh()
  } catch (error) {
    toast.add({
      title: 'Update failed',
      description: resolveErrorMessage(error),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Nav Links management
function addNavLink() {
  state.navLinks.push({ label: '', to: '' })
}

function removeNavLink(index: number) {
  state.navLinks.splice(index, 1)
}

// Footer Links management
function addFooterLink() {
  state.footer.links.push({ label: '', to: '' })
}

function removeFooterLink(index: number) {
  state.footer.links.splice(index, 1)
}

// Social Links management
function addSocialLink() {
  state.footer.socials.push({ label: '', icon: 'i-lucide-link', url: '' })
}

// Helpers for single image <-> array conversion
function toImageArray(value: string | null | undefined): string[] {
  return value ? [value] : []
}

function fromImageArray(arr: string[]): string | null {
  return arr[0] ?? null
}

function removeSocialLink(index: number) {
  state.footer.socials.splice(index, 1)
}

const iconOptions = [
  { label: 'Facebook', value: 'i-lucide-facebook' },
  { label: 'Instagram', value: 'i-lucide-instagram' },
  { label: 'Twitter/X', value: 'i-lucide-twitter' },
  { label: 'YouTube', value: 'i-lucide-youtube' },
  { label: 'TikTok', value: 'i-simple-icons-tiktok' },
  { label: 'LinkedIn', value: 'i-lucide-linkedin' },
  { label: 'WhatsApp', value: 'i-simple-icons-whatsapp' },
  { label: 'Telegram', value: 'i-simple-icons-telegram' },
  { label: 'Email', value: 'i-lucide-mail' },
  { label: 'Phone', value: 'i-lucide-phone' },
  { label: 'Link', value: 'i-lucide-link' }
]
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Storefront Layout"
      description="Configure header, navigation links, and footer for the storefront."
      variant="subtle"
    >
      <UAlert
        v-if="pending"
        color="neutral"
        icon="i-lucide-loader"
        title="Loading layout content..."
        class="mb-4"
      />

      <UForm
        :state="state"
        :schema="layoutSchema"
        class="space-y-8"
        @submit="handleSave"
      >
        <!-- Brand Section -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Brand
          </legend>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <UFormField label="Store Name" name="brand.name">
              <UInput v-model="state.brand.name" placeholder="My Store" />
            </UFormField>

            <UFormField label="Logo" name="brand.logoUrl" class="md:col-span-2">
              <MediaS3ImageUploader
                :model-value="toImageArray(state.brand.logoUrl)"
                single-mode
                class="w-full max-w-sm"
                @update:model-value="state.brand.logoUrl = fromImageArray($event)"
              />
              <UInput
                v-model="state.brand.logoUrl"
                placeholder="Or paste logo URL..."
                class="mt-2"
              />
            </UFormField>

            <UFormField label="Home URL" name="brand.homeUrl">
              <UInput v-model="state.brand.homeUrl" placeholder="/" />
            </UFormField>
          </div>
        </fieldset>

        <!-- Navigation Links -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Navigation Links
          </legend>

          <div class="flex items-center justify-between mb-3 mt-2">
            <span class="text-sm text-neutral-500">Links shown in the header navigation</span>
            <UButton
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              @click="addNavLink"
            >
              Add Link
            </UButton>
          </div>

          <div v-if="state.navLinks.length === 0" class="text-sm text-neutral-500 italic">
            No navigation links configured.
          </div>

          <div v-for="(link, idx) in state.navLinks" :key="idx" class="flex items-center gap-3 mb-2">
            <UInput v-model="link.label" placeholder="Label" class="flex-1" />
            <UInput v-model="link.to" placeholder="/path" class="flex-1" />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="removeNavLink(idx)"
            />
          </div>
        </fieldset>

        <!-- Header Actions -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Header Actions
          </legend>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div class="flex items-center gap-3">
              <UCheckbox v-model="state.actions.showSearch" />
              <span class="text-sm">Show Search</span>
            </div>

            <UFormField label="Search URL" name="actions.searchUrl">
              <UInput v-model="state.actions.searchUrl" placeholder="/search" :disabled="!state.actions.showSearch" />
            </UFormField>

            <div class="flex items-center gap-3">
              <UCheckbox v-model="state.actions.showWishlist" />
              <span class="text-sm">Show Wishlist</span>
            </div>

            <div class="flex items-center gap-3">
              <UCheckbox v-model="state.actions.showCart" />
              <span class="text-sm">Show Cart</span>
            </div>

            <UFormField label="Account URL" name="actions.accountUrl" class="md:col-span-2">
              <UInput v-model="state.actions.accountUrl" placeholder="/admin/login" />
            </UFormField>
          </div>
        </fieldset>

        <!-- Footer -->
        <fieldset class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <legend class="text-sm font-semibold px-2">
            Footer
          </legend>

          <div class="grid grid-cols-1 gap-4 mt-4">
            <UFormField label="Copyright Text" name="footer.copyright">
              <UInput v-model="state.footer.copyright" placeholder="© 2026 Store Name" />
            </UFormField>

            <UFormField label="Description" name="footer.description">
              <UTextarea v-model="state.footer.description" :rows="2" placeholder="Short description..." />
            </UFormField>
          </div>

          <!-- Footer Links -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium">Footer Links</span>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                @click="addFooterLink"
              >
                Add Link
              </UButton>
            </div>

            <div v-if="state.footer.links.length === 0" class="text-sm text-neutral-500 italic">
              No footer links configured.
            </div>

            <div v-for="(link, idx) in state.footer.links" :key="idx" class="flex items-center gap-3 mb-2">
              <UInput v-model="link.label" placeholder="Label" class="flex-1" />
              <UInput v-model="link.to" placeholder="/path" class="flex-1" />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="removeFooterLink(idx)"
              />
            </div>
          </div>

          <!-- Social Links -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium">Social Links</span>
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                @click="addSocialLink"
              >
                Add Social
              </UButton>
            </div>

            <div v-if="state.footer.socials.length === 0" class="text-sm text-neutral-500 italic">
              No social links configured.
            </div>

            <div v-for="(social, idx) in state.footer.socials" :key="idx" class="flex items-center gap-3 mb-2">
              <UInput v-model="social.label" placeholder="Label" class="w-32" />
              <USelectMenu
                v-model="social.icon"
                :items="iconOptions"
                value-key="value"
                class="w-40"
              />
              <UInput v-model="social.url" placeholder="https://..." class="flex-1" />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="removeSocialLink(idx)"
              />
            </div>
          </div>
        </fieldset>

        <!-- Submit -->
        <div class="flex justify-end pt-4">
          <UButton
            type="submit"
            color="primary"
            :loading="saving"
            icon="i-lucide-save"
          >
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
