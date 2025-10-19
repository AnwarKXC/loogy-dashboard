import { eventHandler } from 'h3'

import { clearSuperAdminSession } from '../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await clearSuperAdminSession(event)

  return { success: true }
})
