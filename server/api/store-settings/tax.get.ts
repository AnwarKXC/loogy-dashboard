import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  // Get or create singleton settings
  let settings = await prisma.taxSettings.findFirst()

  if (!settings) {
    settings = await prisma.taxSettings.create({
      data: {
        isEnabled: false,
        taxRate: 0,
        taxName: 'VAT',
        includedInPrice: true,
        applyToShipping: false
      }
    })
  }

  return {
    ...settings,
    taxRate: settings.taxRate.toNumber()
  }
})
