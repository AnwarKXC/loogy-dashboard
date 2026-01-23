<script setup lang="ts">
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

definePageMeta({
  layout: 'default'
})

type InvoiceItem = {
  id: number
  productId: number
  productName: string
  productNameAr: string | null
  productNameEn: string | null
  productSlug: string
  productImage: string | null
  variantSku: string | null
  variantAttributes: unknown
  quantity: number
  unitPrice: number
  totalPrice: number
}

type InvoiceData = {
  invoiceNumber: string
  orderNumber: string
  invoiceDate: string
  dueDate: string
  storeName: string
  storeDescription: string | null
  currency: string
  customer: {
    id: number
    name: string
    email: string | null
    phone: string | null
    address: {
      street: string | null
      city: string | null
      country: string | null
    }
    governorate: { nameEn: string, nameAr: string } | null
    area: { nameEn: string, nameAr: string } | null
  }
  status: string
  paymentMethod: string | null
  items: InvoiceItem[]
  subtotal: number
  discount: number
  shippingCost: number
  taxAmount: number
  taxRate: number
  taxName: string
  taxNumber: string | null
  showTaxBreakdown: boolean
  totalAmount: number
  grandTotal: number
  timeline: { status: string, note: string | null, createdAt: string }[]
  createdAt: string
  updatedAt: string
}

type InvoiceResponse = {
  invoice: InvoiceData
}

const route = useRoute()
const toast = useToast()

const orderId = computed(() => Number(route.params.id))
const isGeneratingPdf = ref(false)
const loadingMessage = ref('')
const invoiceRef = ref<HTMLElement | null>(null)

if (!Number.isFinite(orderId.value) || orderId.value <= 0) {
  throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
}

const { data, status, error } = await useFetch<InvoiceResponse>(`/api/orders/${orderId.value}/invoice`)

const invoice = computed(() => data.value?.invoice)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2
  }).format(amount)
}

function formatDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy')
}

function printInvoice() {
  if (!invoiceRef.value) return

  const printContent = invoiceRef.value.innerHTML
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    toast.add({ title: 'Print Failed', description: 'Please allow popups.', color: 'error' })
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.value?.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          background: white; 
          color: black; 
          padding: 20px;
          font-size: 14px;
        }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
        th:first-child { text-align: center; width: 50px; }
        th:nth-child(2) { text-align: left; }
        th:nth-child(3), th:nth-child(4) { text-align: right; width: 90px; }
        td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
        td:first-child { text-align: center; font-weight: 500; }
        td:nth-child(2) { text-align: left; }
        td:nth-child(3), td:nth-child(4) { text-align: right; }
        @page { size: A4; margin: 15mm; }
      </style>
    </head>
    <body>${printContent}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

async function generatePdfBlob(): Promise<Blob | null> {
  if (!invoiceRef.value) return null

  try {
    // Create an isolated iframe to avoid oklch color parsing issues
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '800px'
    iframe.style.height = '1100px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      return null
    }

    // Write a clean HTML document with only hex colors
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; 
            background-color: #ffffff; 
            color: #000000; 
            padding: 24px;
          }
        </style>
      </head>
      <body>${invoiceRef.value.innerHTML}</body>
      </html>
    `)
    iframeDoc.close()

    // Wait for iframe to render
    await new Promise(resolve => setTimeout(resolve, 50))

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 800,
      windowHeight: 1100
    })

    document.body.removeChild(iframe)

    // Use JPEG with compression for smaller file size
    const imgData = canvas.toDataURL('image/jpeg', 0.7)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Calculate ratio to fit content properly on A4
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight)
    const finalWidth = imgWidth * ratio
    const finalHeight = imgHeight * ratio
    const imgX = (pdfWidth - finalWidth) / 2
    const imgY = 5
    pdf.addImage(imgData, 'JPEG', imgX, imgY, finalWidth, finalHeight, undefined, 'FAST')
    return pdf.output('blob')
  } catch (err) {
    console.error('PDF generation failed:', err)
    return null
  }
}

async function downloadPdf() {
  if (!invoice.value) return
  isGeneratingPdf.value = true
  loadingMessage.value = 'Generating PDF...'

  try {
    const blob = await generatePdfBlob()
    if (!blob) throw new Error('Failed to generate PDF')

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoice.value.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.add({ title: 'PDF Downloaded', description: `Invoice saved successfully`, color: 'success' })
  } catch (err) {
    console.error('Download failed:', err)
    toast.add({ title: 'Download Failed', description: 'Could not generate PDF.', color: 'error' })
  } finally {
    isGeneratingPdf.value = false
    loadingMessage.value = ''
  }
}

async function shareInvoice() {
  if (!invoice.value) return
  isGeneratingPdf.value = true
  loadingMessage.value = 'Preparing file...'

  try {
    const blob = await generatePdfBlob()
    if (!blob) throw new Error('Failed to generate PDF')

    const file = new File([blob], `${invoice.value.invoiceNumber}.pdf`, { type: 'application/pdf' })

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Invoice ${invoice.value.invoiceNumber}`,
        text: `Invoice for Order ${invoice.value.orderNumber}`,
        files: [file]
      })
      toast.add({ title: 'Shared', description: 'Invoice shared successfully', color: 'success' })
    } else {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.value.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.add({ title: 'Sharing not supported', description: 'PDF downloaded instead.', color: 'info' })
    }
  } catch (err) {
    console.error('Share failed:', err)
    toast.add({ title: 'Share Failed', description: 'Please try downloading instead.', color: 'error' })
  } finally {
    isGeneratingPdf.value = false
    loadingMessage.value = ''
  }
}
</script>

<template>
  <UDashboardPanel id="invoice">
    <template #header>
      <UDashboardNavbar :title="`Invoice #${invoice?.invoiceNumber ?? orderId}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-printer"
            variant="outline"
            :disabled="isGeneratingPdf"
            @click="printInvoice"
          >
            Print
          </UButton>
          <UButton
            icon="i-lucide-download"
            variant="outline"
            :loading="isGeneratingPdf && loadingMessage.includes('PDF')"
            :disabled="isGeneratingPdf"
            @click="downloadPdf"
          >
            Download PDF
          </UButton>
          <UButton
            icon="i-lucide-share-2"
            variant="outline"
            :loading="isGeneratingPdf && loadingMessage.includes('Preparing')"
            :disabled="isGeneratingPdf"
            @click="shareInvoice"
          >
            Share
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="pb-8">
        <!-- Loading overlay -->
        <div
          v-if="isGeneratingPdf"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div class="bg-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary-500" />
            <span class="text-lg font-medium text-gray-900">{{ loadingMessage }}</span>
          </div>
        </div>

        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="lg"
          :to="`/admin/orders/${orderId}`"
          class="mb-4"
        >
          Back to Order
        </UButton>

        <USkeleton v-if="status === 'pending'" class="h-[800px] w-full max-w-4xl mx-auto" />

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          title="Unable to load invoice"
          :description="error?.message ?? 'Something went wrong'"
        />

        <div
          v-else-if="invoice"
          ref="invoiceRef"
          style="max-width: 896px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #000000; border: 1px solid #e5e7eb;"
        >
          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
            <div>
              <h1 style="font-size: 30px; font-weight: 700; color: #111827;">
                INVOICE
              </h1>
              <p style="color: #6b7280; margin-top: 4px;">
                {{ invoice.invoiceNumber }}
              </p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: 600; color: #111827;">
                {{ invoice.storeName }}
              </h2>
              <p v-if="invoice.storeDescription" style="font-size: 14px; color: #6b7280;">
                {{ invoice.storeDescription }}
              </p>
            </div>
          </div>

          <!-- Invoice Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
            <div>
              <h3 style="font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">
                Bill To
              </h3>
              <p style="font-weight: 600; color: #111827;">
                {{ invoice.customer.name }}
              </p>
              <p v-if="invoice.customer.email" style="font-size: 14px; color: #4b5563;">
                {{ invoice.customer.email }}
              </p>
              <p v-if="invoice.customer.phone" style="font-size: 14px; color: #4b5563;">
                {{ invoice.customer.phone }}
              </p>
              <div style="font-size: 14px; color: #4b5563; margin-top: 8px;">
                <p v-if="invoice.customer.address.street">
                  {{ invoice.customer.address.street }}
                </p>
                <!-- Address in Arabic -->
                <p v-if="invoice.customer.area?.nameAr || invoice.customer.governorate?.nameAr" style="direction: rtl; text-align: left;">
                  {{ invoice.customer.area?.nameAr }}{{ invoice.customer.area?.nameAr && invoice.customer.governorate?.nameAr ? '، ' : '' }}{{ invoice.customer.governorate?.nameAr }}
                </p>
                <!-- Address in English -->
                <p v-if="invoice.customer.area?.nameEn || invoice.customer.governorate?.nameEn">
                  {{ invoice.customer.area?.nameEn }}{{ invoice.customer.area?.nameEn && invoice.customer.governorate?.nameEn ? ', ' : '' }}{{ invoice.customer.governorate?.nameEn }}
                </p>
                <p v-if="invoice.customer.address.country">
                  {{ invoice.customer.address.country }}
                </p>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <p><span style="color: #6b7280;">Invoice Date:</span> {{ formatDate(invoice.invoiceDate) }}</p>
                <p><span style="color: #6b7280;">Order Number:</span> {{ invoice.orderNumber }}</p>
                <p><span style="color: #6b7280;">Order Date:</span> {{ formatDate(invoice.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: center; padding: 12px 8px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; width: 60px;">
                  Qty
                </th>
                <th style="text-align: left; padding: 12px 8px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase;">
                  Item
                </th>
                <th style="text-align: right; padding: 12px 8px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; width: 100px;">
                  Price
                </th>
                <th style="text-align: right; padding: 12px 8px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; width: 100px;">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in invoice.items" :key="item.id" style="border-bottom: 1px solid #f3f4f6;">
                <td style="text-align: center; padding: 16px 8px; font-weight: 500; vertical-align: top;">
                  {{ item.quantity }}
                </td>
                <td style="padding: 16px 8px;">
                  <p v-if="item.productNameAr" style="font-weight: 500; font-size: 15px; color: #111827;">
                    {{ item.productNameAr }}
                  </p>
                  <p v-if="item.productNameEn" style="font-weight: 400; color: #6b7280; font-size: 13px; margin-top: 2px;">
                    {{ item.productNameEn }}
                  </p>
                  <p v-if="!item.productNameAr && !item.productNameEn" style="font-weight: 500;">
                    {{ item.productName }}
                  </p>
                  <p v-if="item.variantSku" style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                    SKU: {{ item.variantSku }}
                  </p>
                </td>
                <td style="text-align: right; padding: 16px 8px; vertical-align: top;">
                  {{ formatCurrency(item.unitPrice) }}
                </td>
                <td style="text-align: right; padding: 16px 8px; font-weight: 500; vertical-align: top;">
                  {{ formatCurrency(item.totalPrice) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 288px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280;">Subtotal</span>
                <span style="font-weight: 500; color: #111827;">{{ formatCurrency(invoice.subtotal) }}</span>
              </div>
              <div v-if="invoice.discount > 0" style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280;">Discount</span>
                <span style="font-weight: 500; color: #16a34a;">-{{ formatCurrency(invoice.discount) }}</span>
              </div>
              <div v-if="invoice.shippingCost > 0" style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280;">Shipping</span>
                <span style="font-weight: 500; color: #111827;">{{ formatCurrency(invoice.shippingCost) }}</span>
              </div>
              <div v-if="invoice.showTaxBreakdown" style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280;">
                  {{ invoice.taxName }} ({{ invoice.taxRate }}%)
                </span>
                <span style="font-weight: 500; color: #111827;">{{ formatCurrency(invoice.taxAmount) }}</span>
              </div>
              <div v-else-if="invoice.taxAmount > 0" style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #9ca3af;">
                <span>{{ invoice.taxName }} included</span>
                <span>{{ formatCurrency(invoice.taxAmount) }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #111827; margin-top: 8px;">
                <span style="font-weight: 600; font-size: 18px; color: #111827;">Total</span>
                <span style="font-weight: 700; font-size: 18px; color: #111827;">{{ formatCurrency(invoice.grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="font-size: 14px; color: #6b7280;">
                  Payment Method / طريقة الدفع
                </p>
                <p style="font-weight: 500; color: #111827;">
                  {{ invoice.paymentMethod === 'CASH' || invoice.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : invoice.paymentMethod?.replace(/_/g, ' ') ?? 'N/A' }}
                </p>
                <p v-if="invoice.paymentMethod === 'CASH' || invoice.paymentMethod === 'CASH_ON_DELIVERY'" style="font-weight: 500; color: #111827;">
                  الدفع عند الاستلام
                </p>
              </div>
              <div v-if="invoice.taxNumber">
                <p style="font-size: 14px; color: #6b7280;">
                  Tax Registration No.
                </p>
                <p style="font-weight: 500; color: #111827;">
                  {{ invoice.taxNumber }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
            <p>Thank you for your business!</p>
            <p>{{ invoice.storeName }}</p>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style>
@media print {
  /* Hide navigation and other non-print elements */
  nav, aside, header:not(.print-header), footer:not(.print-footer) {
    display: none !important;
  }

  /* Full width for invoice content */
  .print\:bg-white {
    background-color: white !important;
    color: black !important;
  }

  body {
    background-color: white !important;
  }
}
</style>
