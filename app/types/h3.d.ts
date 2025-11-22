import type { SuperAdmin, SuperAdminSession } from '../../server/generated/prisma/client'

declare module 'h3' {
  interface H3EventContext {
    superAdmin?: SuperAdmin
    superAdminSession?: SuperAdminSession
  }
}
