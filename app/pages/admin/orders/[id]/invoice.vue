<script setup lang="ts">
import { format } from 'date-fns'

definePageMeta({
  layout: 'default'
})

type InvoiceItem = {
  id: number
  productId: number
  productName: string
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
  window.print()
}

async function downloadPdf() {
  toast.add({
    title: 'PDF Download',
    description: 'Use your browser\'s print dialog (Ctrl+P) and select "Save as PDF"',
    color: 'info'
  })
  window.print()
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
            class="print:hidden"
            @click="printInvoice"
          >
            Print
          </UButton>
          <UButton
            icon="i-lucide-download"
            variant="outline"
            class="print:hidden"
            @click="downloadPdf"
          >
            Download PDF
          </UButton>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
            class="print:hidden"
            :to="`/admin/orders/${orderId}`"
          >
            Back to Order
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <USkeleton v-if="status === 'pending'" class="h-[800px] w-full max-w-4xl mx-auto" />

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        title="Unable to load invoice"
        :description="error?.message ?? 'Something went wrong'"
      />

      <div v-else-if="invoice" class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-900 print:bg-white print:text-black">
        <!-- Invoice Header -->
        <div class="flex justify-between items-start mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white print:text-black">
              INVOICE
            </h1>
            <p class="text-gray-500 mt-1">
              {{ invoice.invoiceNumber }}
            </p>
          </div>
          <div class="text-right">
            <h2 class="text-xl font-semibold">
              {{ invoice.storeName }}
            </h2>
            <p v-if="invoice.storeDescription" class="text-sm text-gray-500">
              {{ invoice.storeDescription }}
            </p>
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 class="text-sm font-medium text-gray-500 uppercase mb-2">
              Bill To
            </h3>
            <p class="font-semibold">
              {{ invoice.customer.name }}
            </p>
            <p v-if="invoice.customer.email" class="text-sm text-gray-600">
              {{ invoice.customer.email }}
            </p>
            <p v-if="invoice.customer.phone" class="text-sm text-gray-600">
              {{ invoice.customer.phone }}
            </p>
            <div v-if="invoice.customer.address.street" class="text-sm text-gray-600 mt-2">
              <p>{{ invoice.customer.address.street }}</p>
              <p>{{ invoice.customer.address.city }}, {{ invoice.customer.address.country }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="space-y-1">
              <p><span class="text-gray-500">Invoice Date:</span> {{ formatDate(invoice.invoiceDate) }}</p>
              <p><span class="text-gray-500">Order Number:</span> {{ invoice.orderNumber }}</p>
              <p><span class="text-gray-500">Order Date:</span> {{ formatDate(invoice.createdAt) }}</p>
              <p>
                <span class="text-gray-500">Status:</span>
                <UBadge
                  :color="invoice.status === 'DELIVERED' ? 'success' : invoice.status === 'SHIPPING' ? 'info' : 'warning'"
                  variant="subtle"
                  class="ml-2"
                >
                  {{ invoice.status }}
                </UBadge>
              </p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="w-full mb-8">
          <thead>
            <tr class="border-b-2 border-gray-200">
              <th class="text-left py-3 text-sm font-medium text-gray-500 uppercase">
                Item
              </th>
              <th class="text-right py-3 text-sm font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th class="text-right py-3 text-sm font-medium text-gray-500 uppercase">
                Price
              </th>
              <th class="text-right py-3 text-sm font-medium text-gray-500 uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in invoice.items" :key="item.id" class="border-b border-gray-100">
              <td class="py-4">
                <p class="font-medium">
                  {{ item.productName }}
                </p>
                <p v-if="item.variantSku" class="text-sm text-gray-500">
                  {{ item.variantSku }}
                </p>
              </td>
              <td class="text-right py-4">
                {{ item.quantity }}
              </td>
              <td class="text-right py-4">
                {{ formatCurrency(item.unitPrice) }}
              </td>
              <td class="text-right py-4 font-medium">
                {{ formatCurrency(item.totalPrice) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="flex justify-end">
          <div class="w-72 space-y-2">
            <div class="flex justify-between py-2">
              <span class="text-gray-500">Subtotal</span>
              <span class="font-medium">{{ formatCurrency(invoice.subtotal) }}</span>
            </div>
            <div v-if="invoice.discount > 0" class="flex justify-between py-2">
              <span class="text-gray-500">Discount</span>
              <span class="font-medium text-green-600">-{{ formatCurrency(invoice.discount) }}</span>
            </div>
            <div v-if="invoice.shippingCost > 0" class="flex justify-between py-2">
              <span class="text-gray-500">Shipping</span>
              <span class="font-medium">{{ formatCurrency(invoice.shippingCost) }}</span>
            </div>
            <div v-if="invoice.showTaxBreakdown" class="flex justify-between py-2">
              <span class="text-gray-500">
                {{ invoice.taxName }} ({{ invoice.taxRate }}%)
              </span>
              <span class="font-medium">{{ formatCurrency(invoice.taxAmount) }}</span>
            </div>
            <div v-else-if="invoice.taxAmount > 0" class="flex justify-between py-2 text-sm text-gray-400">
              <span>{{ invoice.taxName }} included</span>
              <span>{{ formatCurrency(invoice.taxAmount) }}</span>
            </div>
            <div class="flex justify-between py-3 border-t-2 border-gray-900 dark:border-white print:border-black">
              <span class="font-semibold text-lg">Total</span>
              <span class="font-bold text-lg">{{ formatCurrency(invoice.grandTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">
                Payment Method
              </p>
              <p class="font-medium">
                {{ invoice.paymentMethod?.replace(/_/g, ' ') ?? 'N/A' }}
              </p>
            </div>
            <div v-if="invoice.taxNumber">
              <p class="text-sm text-gray-500">
                Tax Registration No.
              </p>
              <p class="font-medium">
                {{ invoice.taxNumber }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <p>{{ invoice.storeName }}</p>
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
