import type { Admin, AdminSession } from '../../server/generated/prisma/client'

declare module 'h3' {
  interface H3EventContext {
    superAdmin?: Admin
    superAdminSession?: AdminSession
  }
}
