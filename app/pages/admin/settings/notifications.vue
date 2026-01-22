<script setup lang="ts">
const toast = useToast()

const { data: preferences } = await useFetch('/api/settings/notifications')

const state = reactive({
  notifyOrders: preferences.value?.notifyOrders ?? true,
  notifyMessages: preferences.value?.notifyMessages ?? true
})

async function onChange() {
  try {
    await $fetch('/api/settings/notifications', {
      method: 'POST',
      body: state
    })
    toast.add({ title: 'Preferences updated', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update preferences', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-8">
    <UPageCard
      title="Browser Notifications"
      variant="subtle"
    >
      <div class="flex items-center justify-between p-4 bg-  rounded">
        <div class="flex flex-col  ">
          <span class="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Push notifications are disabled in this build.
          </span>
        </div>
        <USwitch :model-value="false" disabled />
      </div>
    </UPageCard>

    <UPageCard
      title="Notification Preferences"
      variant="subtle"
    >
      <div class="space-y-8 p-4   rounded">
        <div class="flex items-center justify-between w-full">
          <div class="flex flex-col flex-grow">
            <span class="text-sm font-medium text-gray-900 dark:text-white">New Orders</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">Receive notifications when a new order is placed.</span>
          </div>
          <USwitch
            v-model="state.notifyOrders"
            @update:model-value="onChange"
          />
        </div>

        <UDivider />
        <UDivider />

        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-900 dark:text-white">New Messages</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">Receive notifications when a customer sends a message.</span>
          </div>
          <USwitch
            v-model="state.notifyMessages"
            @update:model-value="onChange"
          />
        </div>
      </div>
    </UPageCard>
  </div>
</template>
