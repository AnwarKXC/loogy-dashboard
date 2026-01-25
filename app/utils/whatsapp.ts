import type { ProductAvailabilityType } from '~/types'

export interface WhatsAppCartItem {
  name: string
  nameAr?: string
  price: number
  quantity: number
  image?: string | null
  slug: string
  availabilityType: ProductAvailabilityType
}

/**
 * Build a WhatsApp URL with pre-filled message for pre-order inquiries
 */
export function buildPreOrderWhatsAppUrl(
  items: WhatsAppCartItem[],
  storePhone: string,
  baseUrl: string
): string {
  const preOrderItems = items.filter(item => item.availabilityType === 'PRE_ORDER')

  if (preOrderItems.length === 0) {
    return ''
  }

  // Build message in Arabic and English
  const lines: string[] = [
    '🛍️ استفسار عن منتجات - Pre-Order Inquiry',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    ''
  ]

  let totalAmount = 0

  preOrderItems.forEach((item, index) => {
    const itemTotal = item.price * item.quantity
    totalAmount += itemTotal

    lines.push(`${index + 1}. ${item.nameAr || item.name}`)
    if (item.nameAr && item.name !== item.nameAr) {
      lines.push(`   ${item.name}`)
    }
    lines.push(`   الكمية / Qty: ${item.quantity}`)
    lines.push(`   السعر / Price: ${item.price.toLocaleString('en-EG')} EGP`)
    lines.push(`   🔗 ${baseUrl}/products/${item.slug}`)
    lines.push('')
  })

  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push(`💰 المجموع / Total: ${totalAmount.toLocaleString('en-EG')} EGP`)
  lines.push('')
  lines.push('أرغب في الاستفسار عن هذه المنتجات')
  lines.push('I would like to inquire about these products')

  const message = encodeURIComponent(lines.join('\n'))
  const phone = storePhone.replace(/[^0-9]/g, '')

  return `https://wa.me/${phone}?text=${message}`
}

/**
 * Get delivery estimate text based on availability type
 */
export function getDeliveryEstimate(
  availabilityType: ProductAvailabilityType,
  expectedArrivalDate?: string | null,
  locale: 'en' | 'ar' = 'en'
): { text: string, days?: string } {
  switch (availabilityType) {
    case 'IN_STOCK_EGYPT':
      return {
        text: locale === 'ar' ? 'جاهز للشحن' : 'Ready to Ship',
        days: locale === 'ar' ? '٢-٤ أيام' : '2-4 days'
      }
    case 'ARRIVING_SOON': {
      if (expectedArrivalDate) {
        const arrivalDate = new Date(expectedArrivalDate)
        const now = new Date()
        const diffDays = Math.ceil((arrivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const weeksText = diffDays <= 7
          ? (locale === 'ar' ? 'أسبوع واحد' : '1 week')
          : (locale === 'ar' ? '١-٢ أسبوع' : '1-2 weeks')
        return {
          text: locale === 'ar' ? 'قادم قريباً' : 'Arriving Soon',
          days: weeksText
        }
      }
      return {
        text: locale === 'ar' ? 'قادم قريباً' : 'Arriving Soon',
        days: locale === 'ar' ? '١-٢ أسبوع' : '1-2 weeks'
      }
    }
    case 'PRE_ORDER':
      return {
        text: locale === 'ar' ? 'طلب مسبق' : 'Pre-Order',
        days: locale === 'ar' ? 'تواصل معنا' : 'Contact us'
      }
    default:
      return { text: '', days: '' }
  }
}

/**
 * Get badge color for availability type
 */
export function getAvailabilityBadgeColor(availabilityType: ProductAvailabilityType): 'success' | 'warning' | 'info' | 'neutral' {
  switch (availabilityType) {
    case 'IN_STOCK_EGYPT':
      return 'success' // Green
    case 'ARRIVING_SOON':
      return 'warning' // Yellow/Orange
    case 'PRE_ORDER':
      return 'info' // Blue
    default:
      return 'neutral'
  }
}

/**
 * Get availability icon
 */
export function getAvailabilityIcon(availabilityType: ProductAvailabilityType): string {
  switch (availabilityType) {
    case 'IN_STOCK_EGYPT':
      return 'i-lucide-package-check'
    case 'ARRIVING_SOON':
      return 'i-lucide-truck'
    case 'PRE_ORDER':
      return 'i-lucide-message-circle'
    default:
      return 'i-lucide-package'
  }
}
