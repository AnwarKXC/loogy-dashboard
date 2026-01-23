import { z } from 'zod'
import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

const RouteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER', 'SALES'] })

  const { id } = await getValidatedRouterParams(event, RouteParamsSchema.parse)

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: true,
              translations: {
                select: { lang: true, name: true }
              }
            }
          },
          variant: {
            select: {
              sku: true,
              attributes: true
            }
          }
        }
      },
      governorate: true,
      area: true,
      timeline: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    })
  }

  // Get store and tax settings
  const [storeSettings, taxSettings] = await Promise.all([
    prisma.appSettings.findFirst(),
    prisma.taxSettings.findFirst()
  ])

  // Generate invoice number
  const invoiceNumber = `INV-${order.id.toString().padStart(6, '0')}`
  const orderNumber = `ORD-${order.id.toString().padStart(6, '0')}`

  // Calculate tax if enabled
  let taxAmount = 0
  let taxRate = 0
  let taxName = 'VAT'
  let showTaxBreakdown = false

  if (taxSettings?.isEnabled) {
    taxRate = taxSettings.taxRate.toNumber()
    taxName = taxSettings.taxName
    showTaxBreakdown = !taxSettings.includedInPrice

    if (!taxSettings.includedInPrice) {
      // Tax added on top
      const taxableAmount = taxSettings.applyToShipping
        ? order.totalAmount.toNumber()
        : order.subtotal.toNumber() - (order.discount?.toNumber() ?? 0)
      taxAmount = (taxableAmount * taxRate) / 100
    } else {
      // Tax included - calculate for display
      const taxableAmount = taxSettings.applyToShipping
        ? order.totalAmount.toNumber()
        : order.subtotal.toNumber() - (order.discount?.toNumber() ?? 0)
      taxAmount = (taxableAmount * taxRate) / (100 + taxRate)
    }
  }

  // Format items
  const items = order.items.map((item) => {
    const productName = item.product.translations.find(t => t.lang === 'AR')?.name
      ?? item.product.translations.find(t => t.lang === 'EN')?.name
      ?? item.product.slug

    return {
      id: item.id,
      productId: item.productId,
      productName,
      productSlug: item.product.slug,
      productImage: item.product.images[0] ?? null,
      variantSku: item.variant?.sku ?? null,
      variantAttributes: item.variant?.attributes ?? null,
      quantity: item.quantity,
      unitPrice: item.price.toNumber(),
      totalPrice: item.totalPrice.toNumber()
    }
  })

  return {
    invoice: {
      invoiceNumber,
      orderNumber,
      invoiceDate: order.createdAt.toISOString(),
      dueDate: order.createdAt.toISOString(), // Same as invoice date for COD

      // Store info
      storeName: storeSettings?.storeName ?? 'Store',
      storeDescription: storeSettings?.storeDescription ?? null,
      currency: storeSettings?.currency ?? 'EGP',

      // Customer info
      customer: {
        name: order.customerName,
        email: order.customerEmail ?? null,
        phone: order.customerPhone,
        shippingPhone: order.shippingPhone,
        address: {
          street: order.shippingStreet,
          city: order.shippingCity,
          country: order.shippingCountry
        },
        governorate: order.governorate
          ? {
              nameEn: order.governorate.nameEn,
              nameAr: order.governorate.nameAr
            }
          : null,
        area: order.area
          ? {
              nameEn: order.area.nameEn,
              nameAr: order.area.nameAr
            }
          : null
      },

      // Order details
      status: order.status,
      paymentMethod: order.paymentMethod,
      items,

      // Totals
      subtotal: order.subtotal.toNumber(),
      discount: order.discount?.toNumber() ?? 0,
      shippingCost: order.shippingCost.toNumber(),
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate,
      taxName,
      taxNumber: taxSettings?.taxNumber ?? null,
      showTaxBreakdown,
      totalAmount: order.totalAmount.toNumber(),
      grandTotal: showTaxBreakdown
        ? order.totalAmount.toNumber() + taxAmount
        : order.totalAmount.toNumber(),

      // Timeline
      timeline: order.timeline.map(t => ({
        status: t.status,
        note: t.note,
        createdAt: t.createdAt.toISOString()
      })),

      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }
  }
})
