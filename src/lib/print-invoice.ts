import { generateA4InvoiceHTML, generateThermalReceiptHTML } from '@/lib/invoice-templates'

export type PrintTemplate = 'THERMAL_80MM' | 'A4'

export interface PrintableSale {
  invoiceNumber: string
  createdAt: string | Date
  customerName: string
  customerMobile?: string | null
  subtotal: number
  discountType?: 'PERCENTAGE' | 'FLAT'
  discountValue?: number
  discountAmount: number
  labourCost: number
  taxAmount?: number
  grandTotal: number
  paymentStatus?: string
  paymentMode?: string
  items: Array<{
    product?: { name?: string; sku?: string }
    productName?: string
    sku?: string
    quantity: number
    saleRate: number
    unitPrice?: number
    sellingPriceAtSale?: number
    totalPrice?: number
  }>
}

export interface PrintableSettings {
  storeName: string
  storeAddress?: string
  storeCity?: string
  storeMobile?: string
  storeEmail?: string
  gstNumber?: string
  termsConditions?: string
  currencySymbol: string
  printTemplate: PrintTemplate
}

export function normalizeSettingsForPrint(settings: Record<string, unknown>): PrintableSettings {
  const thermal = String(settings.thermalPaperWidth ?? '').toLowerCase()
  let printTemplate: PrintTemplate = 'THERMAL_80MM'
  if (settings.printTemplate === 'A4') {
    printTemplate = 'A4'
  } else if (thermal.includes('a4')) {
    printTemplate = 'A4'
  }

  return {
    storeName: String(settings.storeName ?? 'My Store'),
    storeAddress: settings.storeAddress ? String(settings.storeAddress) : undefined,
    storeCity: settings.storeCity ? String(settings.storeCity) : undefined,
    storeMobile: String(settings.storeMobile ?? settings.storePhone ?? ''),
    storeEmail: settings.storeEmail ? String(settings.storeEmail) : undefined,
    gstNumber: settings.gstNumber ? String(settings.gstNumber) : undefined,
    termsConditions: settings.termsConditions ? String(settings.termsConditions) : undefined,
    currencySymbol: String(settings.currencySymbol ?? '₹'),
    printTemplate,
  }
}

export function normalizeSaleForPrint(sale: Record<string, unknown>): PrintableSale {
  const lineItems = (sale.saleItems ?? sale.items ?? []) as Array<Record<string, unknown>>

  return {
    invoiceNumber: String(sale.invoiceNumber ?? ''),
    createdAt: (sale.createdAt as string) ?? new Date().toISOString(),
    customerName: String(
      (sale.customer as { name?: string } | undefined)?.name ??
        sale.customerName ??
        'Walk-in Customer'
    ),
    customerMobile: String(
      (sale.customer as { mobile?: string } | undefined)?.mobile ??
        sale.customerMobile ??
        ''
    ) || null,
    subtotal: Number(sale.subtotal ?? 0),
    discountType:
      sale.discountType === 'PERCENTAGE' || sale.discountType === 'FLAT'
        ? sale.discountType
        : undefined,
    discountValue: Number(sale.discountValue ?? 0),
    discountAmount: Number(sale.discountAmount ?? 0),
    labourCost: Number(sale.labourCost ?? 0),
    taxAmount: Number(sale.taxAmount ?? 0),
    grandTotal: Number(sale.grandTotal ?? 0),
    paymentStatus: sale.paymentStatus ? String(sale.paymentStatus) : undefined,
    paymentMode: sale.paymentMode ? String(sale.paymentMode) : undefined,
    items: lineItems.map((item) => {
      const rate = Number(
        item.unitPrice ?? item.sellingPriceAtSale ?? item.saleRate ?? 0
      )
      return {
        product: {
          name: String(item.productName ?? (item.product as { name?: string })?.name ?? 'Item'),
          sku: String(item.sku ?? (item.product as { sku?: string })?.sku ?? ''),
        },
        productName: item.productName ? String(item.productName) : undefined,
        sku: item.sku ? String(item.sku) : undefined,
        quantity: Number(item.quantity ?? 0),
        saleRate: rate,
        unitPrice: rate,
        totalPrice: Number(item.totalPrice ?? rate * Number(item.quantity ?? 0)),
      }
    }),
  }
}

function printHtmlInBrowser(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  if (!win) {
    document.body.removeChild(iframe)
    throw new Error('Could not open print preview')
  }

  const doc = win.document
  doc.open()
  doc.write(html)
  doc.close()

  win.focus()
  win.print()

  setTimeout(() => {
    document.body.removeChild(iframe)
  }, 1000)
}

export async function printInvoiceHtml(
  html: string,
  template: PrintTemplate = 'THERMAL_80MM'
): Promise<void> {
  if (typeof window !== 'undefined' && window.electron) {
    const result =
      template === 'A4'
        ? await window.electron.printA4(html)
        : await window.electron.printThermal(html)

    if (!result.success) {
      throw new Error(result.error ?? 'Print failed')
    }
    return
  }

  printHtmlInBrowser(html)
}

export function buildInvoiceHtml(
  sale: PrintableSale,
  settings: PrintableSettings
): string {
  return settings.printTemplate === 'A4'
    ? generateA4InvoiceHTML(sale, settings)
    : generateThermalReceiptHTML(sale, settings)
}

export async function printSale(
  sale: Record<string, unknown>,
  settings: Record<string, unknown>
): Promise<void> {
  const printableSale = normalizeSaleForPrint(sale)
  const printableSettings = normalizeSettingsForPrint(settings)
  const html = buildInvoiceHtml(printableSale, printableSettings)
  await printInvoiceHtml(html, printableSettings.printTemplate)
}

export async function printSaleById(saleId: string): Promise<void> {
  const [saleRes, settingsRes] = await Promise.all([
    fetch(`/api/sales/${saleId}`),
    fetch('/api/settings'),
  ])

  const sale = await saleRes.json()
  const settings = await settingsRes.json()

  if (!saleRes.ok) {
    throw new Error(sale.error ?? 'Failed to load invoice for printing')
  }
  if (!settingsRes.ok) {
    throw new Error(settings.error ?? 'Failed to load store settings for printing')
  }

  await printSale(sale, settings)
}
