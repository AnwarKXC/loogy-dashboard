export interface SuperAdminSessionUser {
  id: number
  email: string
  name: string | null
  role: 'OWNER' | 'MANAGER' | 'SALES'
}

export const useSuperAdminState = () => useState<SuperAdminSessionUser | null>('super-admin-session', () => null)
