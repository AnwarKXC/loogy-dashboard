<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  links?: {
    facebook?: string
    instagram?: string
    whatsapp?: string
    youtube?: string
  }
}>()

const fallbackLinks = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  whatsapp: 'https://wa.me/201000000000',
  youtube: 'https://youtube.com'
}

const resolvedLinks = computed(() => ({
  ...fallbackLinks,
  ...(props.links || {})
}))
</script>

<template>
  <section id="contact" class="space-y-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
    <h2 class="text-xl font-semibold flex items-center gap-2">
      <UIcon name="i-lucide-share-2" class="text-primary" />
      تابعنا على السوشيال
    </h2>
    <div class="flex flex-wrap gap-3">
      <UButton
        icon="i-lucide-facebook"
        variant="subtle"
        color="primary"
        :to="resolvedLinks.facebook"
        target="_blank"
      >
        Facebook
      </UButton>
      <UButton
        icon="i-lucide-instagram"
        variant="subtle"
        color="primary"
        :to="resolvedLinks.instagram"
        target="_blank"
      >
        Instagram
      </UButton>
      <UButton
        icon="i-lucide-messages-square"
        variant="subtle"
        color="primary"
        :to="resolvedLinks.whatsapp"
        target="_blank"
      >
        WhatsApp
      </UButton>
      <UButton
        icon="i-lucide-youtube"
        variant="subtle"
        color="primary"
        :to="resolvedLinks.youtube"
        target="_blank"
      >
        YouTube
      </UButton>
    </div>
  </section>
</template>
