import type { SuperAdmin, SuperAdminSession } from '~/generated/prisma'

declare module 'h3' {
  interface H3EventContext {
    superAdmin?: SuperAdmin
    superAdminSession?: SuperAdminSession
  }
}
