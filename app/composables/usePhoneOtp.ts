import { ref } from 'vue'

export function usePhoneOtp() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const verified = ref(false)
  const codeSent = ref(false)
  const cooldownSeconds = ref(0)
  const attemptsRemaining = ref(3)

  let cooldownInterval: ReturnType<typeof setInterval> | null = null

  function startCooldown(seconds: number) {
    cooldownSeconds.value = seconds
    if (cooldownInterval) clearInterval(cooldownInterval)
    cooldownInterval = setInterval(() => {
      cooldownSeconds.value--
      if (cooldownSeconds.value <= 0) {
        if (cooldownInterval) clearInterval(cooldownInterval)
        cooldownInterval = null
      }
    }, 1000)
  }

  async function sendCode(phone: string): Promise<boolean> {
    if (!phone || cooldownSeconds.value > 0) return false

    loading.value = true
    error.value = null

    try {
      await $fetch('/api/public/otp/send', {
        method: 'POST',
        body: { phone }
      })
      codeSent.value = true
      startCooldown(60) // 60 second cooldown
      return true
    } catch (err: unknown) {
      const fetchError = err as { data?: { message?: string, data?: { cooldownSeconds?: number } } }
      error.value = fetchError.data?.message || 'Failed to send verification code'
      if (fetchError.data?.data?.cooldownSeconds) {
        startCooldown(fetchError.data.data.cooldownSeconds)
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function verifyCode(phone: string, code: string): Promise<boolean> {
    if (!phone || !code) return false

    loading.value = true
    error.value = null

    try {
      await $fetch('/api/public/otp/verify', {
        method: 'POST',
        body: { phone, code }
      })
      verified.value = true
      return true
    } catch (err: unknown) {
      const fetchError = err as { data?: { message?: string, data?: { attemptsRemaining?: number } } }
      error.value = fetchError.data?.message || 'Invalid verification code'
      if (fetchError.data?.data?.attemptsRemaining !== undefined) {
        attemptsRemaining.value = fetchError.data.data.attemptsRemaining
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function checkStatus(phone: string): Promise<boolean> {
    if (!phone) return false

    try {
      const result = await $fetch<{ verified: boolean }>('/api/public/otp/status', {
        query: { phone }
      })
      verified.value = result.verified
      return result.verified
    } catch {
      return false
    }
  }

  function reset() {
    verified.value = false
    codeSent.value = false
    error.value = null
    attemptsRemaining.value = 3
    if (cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
    cooldownSeconds.value = 0
  }

  return {
    loading,
    error,
    verified,
    codeSent,
    cooldownSeconds,
    attemptsRemaining,
    sendCode,
    verifyCode,
    checkStatus,
    reset
  }
}
