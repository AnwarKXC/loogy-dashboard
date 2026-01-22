import prisma from '../../db'

// Public API to get store settings for storefront
export default defineEventHandler(async () => {
  const [general, contact, social] = await Promise.all([
    prisma.appSettings.findFirst(),
    prisma.contactSettings.findFirst(),
    prisma.socialSettings.findFirst()
  ])

  return {
    general: general
      ? {
          storeName: general.storeName,
          storeDescription: general.storeDescription,
          currency: general.currency,
          languageOptions: general.languageOptions,
          defaultLanguage: general.defaultLanguage
        }
      : null,
    contact: contact
      ? {
          phoneNumber: contact.phoneNumber,
          vodafoneCashNumber: contact.vodafoneCashNumber,
          instaPayUrl: contact.instaPayUrl,
          instaPayQrCode: contact.instaPayQrCode,
          instaPayNumber: contact.instaPayNumber
        }
      : null,
    social: social
      ? {
          facebookGroup: social.facebookGroup,
          facebookPage: social.facebookPage,
          instagramPage: social.instagramPage
        }
      : null
  }
})
