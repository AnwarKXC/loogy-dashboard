import type { SuperAdminSessionUser } from '~/composables/useSuperAdmin'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login']
  const superAdmin = useSuperAdminState()
  const initialized = useState('super-admin-session-initialized', () => false)

  if (!initialized.value) {
    try {
      const headers = import.meta.server ? { cookie: useRequestHeaders(['cookie'])?.cookie ?? '' } : undefined
      const data = await $fetch<{ superAdmin: SuperAdminSessionUser | null }>('/api/superadmin/session', {
        headers
      })
      superAdmin.value = data.superAdmin
    } catch {
      superAdmin.value = null
    } finally {
      initialized.value = true
    }
  }

  if (superAdmin.value && to.path === '/login') {
    return navigateTo('/')
  }

  if (!superAdmin.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
