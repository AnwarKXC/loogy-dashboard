<script setup lang="ts">
const props = withDefaults(defineProps<{
  count?: number
  ids?: number[]
}>(), {
  count: 0,
  ids: () => []
})

const emit = defineEmits<{ (e: 'deleted', deleted: number): void }>()

const open = ref(false)
const isDeleting = ref(false)
const toast = useToast()

async function onSubmit() {
  if (isDeleting.value || !props.ids.length) {
    return
  }

  try {
    isDeleting.value = true

    const { deleted } = await $fetch<{ deleted: number }>('/api/customers', {
      method: 'DELETE',
      body: {
        ids: props.ids
      }
    })

    toast.add({
      title: 'Customers deleted',
      description: `${deleted} customer${deleted > 1 ? 's' : ''} removed successfully.`,
      color: 'success'
    })

    emit('deleted', deleted)
    open.value = false
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to delete customers'
    toast.add({
      title: 'Deletion failed',
      description: message,
      color: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${count} customer${count > 1 ? 's' : ''}`"
    :description="`Are you sure? This action cannot be undone.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Delete"
          color="error"
          variant="solid"
          :disabled="!ids.length"
          :loading="isDeleting"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
