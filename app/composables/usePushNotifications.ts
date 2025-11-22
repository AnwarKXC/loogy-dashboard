import { ref, onMounted } from 'vue'

export const usePushNotifications = () => {
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const permission = ref('default')

  onMounted(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      isSupported.value = true
      checkSubscription()
    }
  })

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    isSubscribed.value = !!subscription
    permission.value = Notification.permission
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribe = async () => {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.ready

      // Get VAPID key from server
      const { publicKey } = await $fetch<{ publicKey: string }>('/api/notifications/vapid-key')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      // Send subscription to server
      await $fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: subscription
      })

      isSubscribed.value = true
      permission.value = Notification.permission

      new Notification('Notifications Enabled', {
        body: 'You will now receive notifications for new messages.',
        icon: '/icon.png'
      })
    } catch (error) {
      console.error('Failed to subscribe:', error)
    }
  }

  const unsubscribe = async () => {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        // TODO: Remove from server (optional, server handles invalid subs)
        isSubscribed.value = false
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    }
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe
  }
}
