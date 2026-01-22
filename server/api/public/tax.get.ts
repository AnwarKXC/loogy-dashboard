import prisma from '../../db'

// Public API to get tax settings for checkout
export default defineEventHandler(async () => {
  const settings = await prisma.taxSettings.findFirst()

  if (!settings || !settings.isEnabled) {
    return {
      isEnabled: false,
      taxRate: 0,
      taxName: 'VAT',
      includedInPrice: true,
      applyToShipping: false
    }
  }

  return {
    isEnabled: settings.isEnabled,
    taxRate: settings.taxRate.toNumber(),
    taxName: settings.taxName,
    includedInPrice: settings.includedInPrice,
    applyToShipping: settings.applyToShipping
  }
})
