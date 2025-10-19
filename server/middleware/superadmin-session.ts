import { eventHandler } from 'h3'

import { loadSuperAdminFromSession } from '../utils/superadmin-session'

export default eventHandler(async (event) => {
  await loadSuperAdminFromSession(event)
})
