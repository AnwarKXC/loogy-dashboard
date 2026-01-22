<script setup lang="ts">
const toast = useToast()

const isDialogOpen = ref(false)
const message = ref('')

// WhatsApp expects country code; stored without separators.
const whatsappNumber = '201026265857'

const hasMessage = computed(() => message.value.trim().length > 0)

const openDialog = () => {
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
}

const buildWhatsAppLink = () => {
  if (!import.meta.client) return ''

  const pageUrl = window.location.href
  const text = `Hello, I'm on ${pageUrl}.\n\n${message.value.trim()}`
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
}

const sendToWhatsApp = () => {
  if (!hasMessage.value) {
    toast.add({
      title: 'Add a message',
      description: 'Tell us what you need before continuing.',
      color: 'warning'
    })
    return
  }

  const link = buildWhatsAppLink()

  if (link) {
    window.open(link, '_blank', 'noopener')
    message.value = ''
    closeDialog()
  }
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <UButton
          color="primary"
          size="lg"
          icon="i-simple-icons-whatsapp"
          class="h-14 rounded-full shadow-lg"
          @click="openDialog"
        >
          WhatsApp
        </UButton>
      </div>

      <UModal v-model="isDialogOpen" :ui="{ width: 'sm:max-w-md' }">
        <template #header>
          <div class="space-y-1">
            <p class="text-lg font-semibold">
              Send us a message
            </p>
            <p class="text-sm text-muted">
              We'll open WhatsApp with your note and the page you're on.
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Message" required>
            <UTextarea
              v-model="message"
              placeholder="Type your message"
              :rows="4"
              autofocus
            />
          </UFormGroup>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="closeDialog">
              Cancel
            </UButton>
            <UButton
              color="primary"
              icon="i-simple-icons-whatsapp"
              :disabled="!hasMessage"
              @click="sendToWhatsApp"
            >
              Continue in WhatsApp
            </UButton>
          </div>
        </div>
      </UModal>
    </Teleport>
  </ClientOnly>
</template>
