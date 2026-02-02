<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()

const schema = z.object({
  isEnabled: z.boolean(),
  recipientPhone: z.string().max(20).nullable().optional(),
  businessNotificationNumber: z.string().max(20).nullable().optional(),
  autoReconnect: z.boolean(),
  sendToCustomer: z.boolean(),
  sendToBusiness: z.boolean()
})

type Schema = z.output<typeof schema>

interface WhatsAppSettingsResponse {
  id: number
  isEnabled: boolean
  connectionStatus: string
  businessPhone: string | null
  recipientPhone: string | null
  lastConnected: string | null
  qrCode: string | null
  autoReconnect: boolean
  sendToCustomer: boolean
  sendToBusiness: boolean
  businessNotificationNumber: string | null
  createdAt: string
  updatedAt: string
}

const { data, refresh, status } = await useFetch<WhatsAppSettingsResponse>('/api/admin/whatsapp/settings')

const state = reactive<Schema>({
  isEnabled: false,
  recipientPhone: null,
  businessNotificationNumber: null,
  autoReconnect: true,
  sendToCustomer: false,
  sendToBusiness: true
})

// Connection status
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
const qrCode = ref<string | null>(null)
const connecting = ref(false)
const disconnecting = ref(false)
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

watch(data, (val) => {
  if (val) {
    state.isEnabled = val.isEnabled ?? false
    state.recipientPhone = val.recipientPhone ?? null
    state.businessNotificationNumber = val.businessNotificationNumber ?? null
    state.autoReconnect = val.autoReconnect ?? true
    state.sendToCustomer = val.sendToCustomer ?? false
    state.sendToBusiness = val.sendToBusiness ?? true
    connectionStatus.value = (val.connectionStatus as typeof connectionStatus.value) ?? 'disconnected'
    qrCode.value = val.qrCode ?? null

    // If status is connecting, start polling
    if (val.connectionStatus === 'connecting') {
      startPolling()
    }
  }
}, { immediate: true })

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await $fetch('/api/admin/whatsapp/settings', {
      method: 'PUT',
      body: event.data
    })
    toast.add({
      title: 'Settings saved',
      description: 'WhatsApp settings have been updated.',
      color: 'success'
    })
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function connect() {
  connecting.value = true
  try {
    await $fetch('/api/admin/whatsapp/connect', { method: 'POST' })
    // Immediately set status to connecting so UI shows waiting state
    connectionStatus.value = 'connecting'
    toast.add({
      title: 'Connecting',
      description: 'WhatsApp connection initiated. Please wait for QR code.',
      color: 'info'
    })
    // Start polling for status updates
    startPolling()
    // Also check immediately
    await checkStatus()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to connect'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    connecting.value = false
  }
}

async function disconnect() {
  disconnecting.value = true
  try {
    await $fetch('/api/admin/whatsapp/disconnect', { method: 'POST' })
    toast.add({
      title: 'Disconnected',
      description: 'WhatsApp has been disconnected.',
      color: 'success'
    })
    stopPolling()
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    disconnecting.value = false
  }
}

async function checkStatus() {
  try {
    const result = await $fetch<{ status: string, qrCode: string | null }>('/api/admin/whatsapp/status')
    console.log('WhatsApp status check:', result.status, result.qrCode ? 'QR available' : 'No QR')
    connectionStatus.value = result.status as typeof connectionStatus.value
    qrCode.value = result.qrCode ?? null

    // Stop polling if connected
    if (result.status === 'connected') {
      stopPolling()
      toast.add({
        title: 'Connected!',
        description: 'WhatsApp is now connected.',
        color: 'success'
      })
    }
  } catch {
    // Ignore errors during polling
  }
}

function startPolling() {
  if (pollingInterval.value) return
  pollingInterval.value = setInterval(checkStatus, 2000)
}

function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

// Clean up on unmount
onUnmounted(() => {
  stopPolling()
})

// Test message sending
const testPhone = ref('')
const testMessage = ref('')
const sendingTest = ref(false)

async function sendTestMessage() {
  if (!testPhone.value || !testMessage.value) {
    toast.add({
      title: 'Error',
      description: 'Please enter a phone number and message',
      color: 'error'
    })
    return
  }

  sendingTest.value = true
  try {
    await $fetch('/api/admin/whatsapp/test', {
      method: 'POST',
      body: {
        phone: testPhone.value,
        message: testMessage.value
      }
    })
    toast.add({
      title: 'Message sent!',
      description: 'Test message was sent successfully.',
      color: 'success'
    })
    testPhone.value = ''
    testMessage.value = ''
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    sendingTest.value = false
  }
}

const statusColor = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'success'
    case 'connecting': return 'warning'
    case 'failed': return 'error'
    default: return 'neutral'
  }
})

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting...'
    case 'failed': return 'Failed'
    default: return 'Disconnected'
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        WhatsApp Integration
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        Connect WhatsApp to receive order notifications automatically
      </p>
    </div>

    <USkeleton v-if="status === 'pending'" class="h-64 w-full" />

    <template v-else>
      <!-- Connection Status Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-simple-icons-whatsapp" class="w-6 h-6 text-green-500" />
              <span class="font-medium">Connection Status</span>
            </div>
            <UBadge :color="statusColor" size="lg">
              {{ statusText }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <!-- QR Code Display -->
          <div v-if="connectionStatus === 'connecting' && qrCode" class="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 py-4">
            <!-- QR Code -->
            <div class="flex flex-col items-center gap-4">
              <div class="bg-white p-4 rounded-lg shadow-inner border">
                <img :src="qrCode" alt="WhatsApp QR Code" class="w-64 h-64">
              </div>
            </div>

            <!-- Login Steps -->
            <div class="flex flex-col gap-4">
              <h3 class="text-lg font-semibold">
                Steps to log in
              </h3>
              <ol class="space-y-3">
                <li class="flex items-center gap-3">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full border text-sm">1</span>
                  <span>Open WhatsApp <UIcon name="i-simple-icons-whatsapp" class="text-green-500 inline" /> on your phone</span>
                </li>
                <li class="flex items-center gap-3">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full border text-sm">2</span>
                  <span>On Android tap Menu <UIcon name="i-lucide-more-vertical" class="inline" /> · On iPhone tap Settings <UIcon name="i-lucide-settings" class="inline" /></span>
                </li>
                <li class="flex items-center gap-3">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full border text-sm">3</span>
                  <span>Tap <strong>Linked devices</strong>, then <strong>Link device</strong></span>
                </li>
                <li class="flex items-center gap-3">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full border text-sm">4</span>
                  <span>Scan the QR code to confirm</span>
                </li>
              </ol>
              <p class="text-xs text-gray-500 mt-2">
                The QR code refreshes every 60 seconds
              </p>
            </div>
          </div>

          <!-- Waiting for QR -->
          <div v-else-if="connectionStatus === 'connecting' && !qrCode" class="flex flex-col items-center gap-4 py-8">
            <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-primary" />
            <p class="text-sm text-gray-600">
              Generating QR code, please wait...
            </p>
          </div>

          <!-- Connected State -->
          <div v-else-if="connectionStatus === 'connected'" class="flex flex-col items-center gap-4 py-8">
            <UIcon name="i-lucide-check-circle" class="w-12 h-12 text-green-500" />
            <p class="text-sm text-gray-600">
              WhatsApp is connected and ready to send notifications
            </p>
          </div>

          <!-- Disconnected State -->
          <div v-else class="flex flex-col items-center gap-4 py-8">
            <UIcon name="i-lucide-smartphone" class="w-12 h-12 text-gray-400" />
            <p class="text-sm text-gray-600">
              Click "Connect" to link your WhatsApp account
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-center gap-4 pt-4 border-t">
            <UButton
              v-if="connectionStatus !== 'connected'"
              :loading="connecting || connectionStatus === 'connecting'"
              :disabled="connecting || connectionStatus === 'connecting'"
              icon="i-lucide-plug"
              color="primary"
              @click="connect"
            >
              {{ connectionStatus === 'connecting' ? 'Waiting for QR...' : 'Connect WhatsApp' }}
            </UButton>
            <UButton
              v-else
              :loading="disconnecting"
              icon="i-lucide-unplug"
              color="error"
              variant="soft"
              @click="disconnect"
            >
              Disconnect
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Settings Form -->
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UCard>
          <template #header>
            <span class="font-medium">Notification Settings</span>
          </template>

          <div class="space-y-6">
            <UFormField name="isEnabled">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">
                    Enable WhatsApp Notifications
                  </p>
                  <p class="text-sm text-gray-500">
                    Send order notifications via WhatsApp
                  </p>
                </div>
                <USwitch v-model="state.isEnabled" />
              </div>
            </UFormField>

            <div class="border-t pt-6 space-y-4">
              <UFormField label="Primary Notification Number" name="recipientPhone">
                <UInput
                  v-model="state.recipientPhone"
                  placeholder="+20 123 456 7890"
                  class="w-full"
                  :disabled="!state.isEnabled"
                />
                <template #hint>
                  This number will receive all order notifications
                </template>
              </UFormField>

              <UFormField label="Additional Notification Number (Optional)" name="businessNotificationNumber">
                <UInput
                  v-model="state.businessNotificationNumber"
                  placeholder="+20 123 456 7890"
                  class="w-full"
                  :disabled="!state.isEnabled"
                />
                <template #hint>
                  Send copies of notifications to another number
                </template>
              </UFormField>
            </div>

            <div class="border-t pt-6 space-y-4">
              <UFormField name="sendToBusiness">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">
                      Notify Business
                    </p>
                    <p class="text-sm text-gray-500">
                      Send order details to business WhatsApp
                    </p>
                  </div>
                  <USwitch v-model="state.sendToBusiness" :disabled="!state.isEnabled" />
                </div>
              </UFormField>

              <UFormField name="sendToCustomer">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">
                      Notify Customer
                    </p>
                    <p class="text-sm text-gray-500">
                      Send order confirmation to customer WhatsApp
                    </p>
                  </div>
                  <USwitch v-model="state.sendToCustomer" :disabled="!state.isEnabled" />
                </div>
              </UFormField>

              <UFormField name="autoReconnect">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">
                      Auto Reconnect
                    </p>
                    <p class="text-sm text-gray-500">
                      Automatically reconnect if disconnected
                    </p>
                  </div>
                  <USwitch v-model="state.autoReconnect" :disabled="!state.isEnabled" />
                </div>
              </UFormField>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end">
              <UButton
                type="submit"
                :loading="saving"
                icon="i-lucide-save"
              >
                Save Settings
              </UButton>
            </div>
          </template>
        </UCard>
      </UForm>

      <!-- Test Message (only when connected) -->
      <UCard v-if="connectionStatus === 'connected'">
        <template #header>
          <span class="font-medium">Send Test Message</span>
        </template>

        <div class="space-y-4">
          <UFormField label="Phone Number">
            <UInput
              v-model="testPhone"
              placeholder="+20 123 456 7890"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Message">
            <UTextarea
              v-model="testMessage"
              placeholder="Enter your test message..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              :loading="sendingTest"
              icon="i-lucide-send"
              @click="sendTestMessage"
            >
              Send Test
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
