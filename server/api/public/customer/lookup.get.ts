import prisma from '../../../db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = query.phone as string

  if (!phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone number is required'
    })
  }

  // Normalize phone for search - search both formats
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  const searchPatterns: string[] = []

  // If starts with +20, also search for 0 format
  if (cleanPhone.startsWith('+20')) {
    searchPatterns.push(cleanPhone)
    searchPatterns.push('0' + cleanPhone.slice(3))
  }
  // If starts with 0, also search for +20 format
  else if (cleanPhone.startsWith('0')) {
    searchPatterns.push(cleanPhone)
    searchPatterns.push('+2' + cleanPhone)
  }
  else {
    searchPatterns.push(cleanPhone)
  }

  // Find the most recent order with this phone number
  const order = await prisma.order.findFirst({
    where: {
      customerPhone: { in: searchPatterns }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      shippingStreet: true,
      notes: true,
      governorateId: true,
      areaId: true,
      governorate: {
        select: {
          id: true,
          nameEn: true,
          nameAr: true
        }
      },
      area: {
        select: {
          id: true,
          nameEn: true,
          nameAr: true
        }
      }
    }
  })

  if (!order) {
    return { found: false }
  }

  // Extract whatsapp from notes if present
  let whatsapp = ''
  if (order.notes) {
    const whatsappMatch = order.notes.match(/WhatsApp:\s*(.+)$/i)
    if (whatsappMatch && whatsappMatch[1]) {
      whatsapp = whatsappMatch[1].trim()
    }
  }

  // Strip area name prefix from address to prevent duplication
  // Address format: "AreaName, Actual Address Details"
  let cleanAddress = order.shippingStreet
  if (order.area) {
    // Remove area name (both Arabic and English) from the start of the address
    const areaPatterns = [
      order.area.nameEn,
      order.area.nameAr
    ].filter(Boolean)

    for (const areaName of areaPatterns) {
      // Match pattern: "AreaName, " or "AreaName," at the start
      const regex = new RegExp(`^${areaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},\\s*`, 'i')
      if (regex.test(cleanAddress)) {
        cleanAddress = cleanAddress.replace(regex, '')
        break
      }
    }
  }

  return {
    found: true,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      governorateId: order.governorateId,
      areaId: order.areaId,
      address: cleanAddress,
      whatsapp
    }
  }
})
