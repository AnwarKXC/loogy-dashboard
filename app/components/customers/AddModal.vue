<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().min(5, 'Phone number is too short').max(32).optional()
})

type Schema = z.infer<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()

const open = ref(false)
const isSubmitting = ref(false)

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  phoneNumber: undefined
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) {
    return
  }

  try {
    isSubmitting.value = true

    const { customer } = await $fetch<{ customer: { name: string } }>('/api/customers', {
      method: 'POST',
      body: {
        name: event.data.name,
        email: event.data.email,
        phoneNumber: event.data.phoneNumber
      }
    })

    toast.add({
      title: 'Customer created',
      description: `${customer.name} has been added successfully.`,
      color: 'success'
    })

    emit('created')
    resetForm()
    open.value = false
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create customer'
    toast.add({
      title: 'Creation failed',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  state.name = undefined
  state.email = undefined
  state.phoneNumber = undefined
}
</script>

<template>
  <UModal v-model:open="open" title="New customer" description="Add a new customer to the database">
    <UButton label="New customer" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" placeholder="John Doe" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Email" placeholder="john.doe@example.com" name="email">
          <UInput v-model="state.email" class="w-full" />
        </UFormField>
        <UFormField label="Phone Number" placeholder="1234567890" name="phoneNumber">
          <UInput v-model="state.phoneNumber" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Create"
            color="primary"
            variant="solid"
            type="submit"
            :loading="isSubmitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
