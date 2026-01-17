export default defineNuxtRouteMiddleware(async (to) => {
  // Only protect routes with '/admin' prefix
  if (!to.path.startsWith('/admin')) {
    return
  }

  const publicRoutes = ['/admin/login']
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

  if (superAdmin.value && to.path === '/admin/login') {
    return navigateTo('/admin')
  }

  if (!superAdmin.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/admin/login')
  }
})
