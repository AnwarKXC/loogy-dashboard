import { eventHandler } from 'h3'

import { loadSuperAdminFromSession } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  const superAdmin = await loadSuperAdminFromSession(event)

  if (!superAdmin) {
    return { superAdmin: null }
  }

  return {
    superAdmin: {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role
    }
  }
})
