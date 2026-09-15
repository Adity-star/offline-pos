import {
  generateGSTInvoiceHTML,
  generateThermalReceiptHTML,
} from '@/lib/invoice-templates'


// ============================================================================
// PRINT TEMPLATE
// ============================================================================

export type PrintTemplate =
  | 'THERMAL_80MM'
  | 'A4'


// ============================================================================
// SALE ITEM
// ============================================================================

export interface PrintableSaleItem {

  product?: {
    name?: string
    sku?: string
    hsn?: string
    listingPrice?: number
  }

  productName?: string

  sku?: string

  quantity: number

  saleRate: number

  unitPrice?: number

  sellingPriceAtSale?: number

  totalPrice?: number


  // ──────────────────────────────────────────────────────────────────────────
  // GST INVOICE FIELDS
  // ──────────────────────────────────────────────────────────────────────────

  hsn?: string

  /**
   * Listing Price
   *
   * This is displayed as LS on the invoice.
   *
   * Rate is calculated as:
   *
   *   LS / PCS
   */
  listingPrice?: number

  /**
   * Legacy MRP field.
   *
   * Kept temporarily for backward compatibility with
   * existing sales/products.
   */
  mrp?: number

  /**
   * Number of pieces.
   */
  pcs?: number

  /**
   * Scheme discount percentage.
   */
  schemePercent?: number

  /**
   * Discount percentage.
   */
  discPercent?: number

  discountPercent?: number

  discountAmount?: number

  /**
   * GST percentage.
   */
  gstPercent?: number
}


// ============================================================================
// PRINTABLE SALE
// ============================================================================

export interface PrintableSale {

  invoiceNumber: string

  createdAt: string | Date


  // ──────────────────────────────────────────────────────────────────────────
  // CUSTOMER
  // ──────────────────────────────────────────────────────────────────────────

  customerName: string

  customerMobile?: string | null

  customerAddress?: string

  customerGstNumber?: string

  customerPanNumber?: string

  customerState?: string

  customerStateCode?: string

  customerFssai?: string


  // ──────────────────────────────────────────────────────────────────────────
  // SALE TOTALS
  // ──────────────────────────────────────────────────────────────────────────

  subtotal: number

  discountType?:
    | 'PERCENTAGE'
    | 'FLAT'

  discountValue?: number

  discountAmount: number

  labourCost: number

  taxAmount?: number

  grandTotal: number


  // ──────────────────────────────────────────────────────────────────────────
  // PAYMENT
  // ──────────────────────────────────────────────────────────────────────────

  paymentStatus?: string

  paymentMode?: string


  // ──────────────────────────────────────────────────────────────────────────
  // ITEMS
  // ──────────────────────────────────────────────────────────────────────────

  items: PrintableSaleItem[]


  // ──────────────────────────────────────────────────────────────────────────
  // GST INVOICE
  // ──────────────────────────────────────────────────────────────────────────

  dueDate?: string | Date

  cgstAmount?: number

  sgstAmount?: number

  igstAmount?: number

  igstApplicable?: boolean

  roundOff?: number

  /**
   * Kept for compatibility with existing sales data.
   * No longer displayed as a product-table column.
   */
  totalBoxes?: number
}


// ============================================================================
// PRINTABLE SETTINGS
// ============================================================================

export interface PrintableSettings {

  // ──────────────────────────────────────────────────────────────────────────
  // STORE / AGENCY
  // ──────────────────────────────────────────────────────────────────────────

  storeName: string

  storeAddress?: string

  storeCity?: string

  storeMobile?: string

  storeEmail?: string


  // ──────────────────────────────────────────────────────────────────────────
  // GST / TAX
  // ──────────────────────────────────────────────────────────────────────────

  gstNumber?: string

  panNumber?: string

  fssaiNumber?: string

  stateName?: string

  stateCode?: string


  // ──────────────────────────────────────────────────────────────────────────
  // BANK DETAILS
  // ──────────────────────────────────────────────────────────────────────────

  bankName?: string

  bankAccountName?: string

  bankAccountNumber?: string

  bankIfsc?: string

  bankBranch?: string


  // ──────────────────────────────────────────────────────────────────────────
  // INVOICE
  // ──────────────────────────────────────────────────────────────────────────

  termsConditions?: string

  jurisdictionText?: string


  // ──────────────────────────────────────────────────────────────────────────
  // GENERAL
  // ──────────────────────────────────────────────────────────────────────────

  currencySymbol: string

  printTemplate: PrintTemplate

  qrCodeDataUrl?: string
}


// ============================================================================
// NORMALIZE SETTINGS
// ============================================================================

export function normalizeSettingsForPrint(
  settings: Record<string, unknown>
): PrintableSettings {

  const thermal =
    String(
      settings.thermalPaperWidth ?? ''
    ).toLowerCase()


  let printTemplate: PrintTemplate =
    'THERMAL_80MM'


  if (
    settings.printTemplate === 'A4'
  ) {

    printTemplate = 'A4'

  } else if (
    thermal.includes('a4')
  ) {

    printTemplate = 'A4'

  }


  return {

    // ────────────────────────────────────────────────────────────────────────
    // STORE
    // ────────────────────────────────────────────────────────────────────────

    storeName:
      String(
        settings.storeName ??
        'My Store'
      ),


    storeAddress:
      settings.storeAddress
        ? String(settings.storeAddress)
        : undefined,


    storeCity:
      settings.storeCity
        ? String(settings.storeCity)
        : undefined,


    storeMobile:
      String(
        settings.storeMobile ??
        settings.storePhone ??
        ''
      ),


    storeEmail:
      settings.storeEmail
        ? String(settings.storeEmail)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // GST / TAX
    // ────────────────────────────────────────────────────────────────────────

    gstNumber:
      settings.gstNumber
        ? String(settings.gstNumber)
        : undefined,


    panNumber:
      settings.panNumber
        ? String(settings.panNumber)
        : undefined,


    fssaiNumber:
      settings.fssaiNumber
        ? String(settings.fssaiNumber)
        : undefined,


    stateName:
      settings.stateName
        ? String(settings.stateName)
        : undefined,


    stateCode:
      settings.stateCode
        ? String(settings.stateCode)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // BANK
    // ────────────────────────────────────────────────────────────────────────

    bankName:
      settings.bankName
        ? String(settings.bankName)
        : undefined,


    bankAccountName:
      settings.bankAccountName
        ? String(settings.bankAccountName)
        : undefined,


    bankAccountNumber:
      settings.bankAccountNumber
        ? String(settings.bankAccountNumber)
        : undefined,


    bankIfsc:
      settings.bankIfsc
        ? String(settings.bankIfsc)
        : undefined,


    bankBranch:
      settings.bankBranch
        ? String(settings.bankBranch)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // INVOICE
    // ────────────────────────────────────────────────────────────────────────

    termsConditions:
      settings.termsConditions
        ? String(settings.termsConditions)
        : undefined,


    jurisdictionText:
      settings.jurisdictionText
        ? String(settings.jurisdictionText)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // GENERAL
    // ────────────────────────────────────────────────────────────────────────

    currencySymbol:
      String(
        settings.currencySymbol ??
        '₹'
      ),


    printTemplate,


    qrCodeDataUrl:
      settings.qrCodeDataUrl
        ? String(settings.qrCodeDataUrl)
        : undefined,
  }
}


// ============================================================================
// NORMALIZE SALE
// ============================================================================

export function normalizeSaleForPrint(
  sale: Record<string, unknown>
): PrintableSale {

  const lineItems =
    (
      sale.saleItems ??
      sale.items ??
      []
    ) as Array<Record<string, unknown>>


  // ==========================================================================
  // CUSTOMER
  // ==========================================================================

  const customer =
    sale.customer as
      | {
          name?: string
          mobile?: string
          phone?: string
          address?: string
          gstNumber?: string
          gstin?: string
          panNumber?: string
          pan?: string
          state?: string
          stateName?: string
          stateCode?: string
          fssaiNumber?: string
        }
      | undefined


  // ==========================================================================
  // NORMALIZED CUSTOMER VALUES
  // ==========================================================================

  const customerName =
    String(
      customer?.name ??
      sale.customerName ??
      'Walk-in Customer'
    )


  const customerMobile =
    String(
      customer?.mobile ??
      customer?.phone ??
      sale.customerMobile ??
      sale.customerPhone ??
      ''
    ) || null


  const customerAddress =
    customer?.address
      ? String(customer.address)
      : sale.customerAddress
        ? String(sale.customerAddress)
        : undefined


  const customerGstNumber =
    customer?.gstNumber
      ? String(customer.gstNumber)
      : customer?.gstin
        ? String(customer.gstin)
        : sale.customerGstNumber
          ? String(sale.customerGstNumber)
          : sale.customerGstin
            ? String(sale.customerGstin)
            : undefined


  const customerPanNumber =
    customer?.panNumber
      ? String(customer.panNumber)
      : customer?.pan
        ? String(customer.pan)
        : sale.customerPanNumber
          ? String(sale.customerPanNumber)
          : sale.customerPan
            ? String(sale.customerPan)
            : undefined


  const customerState =
    customer?.state
      ? String(customer.state)
      : customer?.stateName
        ? String(customer.stateName)
        : sale.customerState
          ? String(sale.customerState)
          : sale.customerStateName
            ? String(sale.customerStateName)
            : undefined


  const customerStateCode =
    customer?.stateCode
      ? String(customer.stateCode)
      : sale.customerStateCode
        ? String(sale.customerStateCode)
        : undefined


  const customerFssai =
    customer?.fssaiNumber
      ? String(customer.fssaiNumber)
      : sale.customerFssai
        ? String(sale.customerFssai)
        : undefined


  // ==========================================================================
  // RETURN PRINTABLE SALE
  // ==========================================================================

  return {

    // ────────────────────────────────────────────────────────────────────────
    // INVOICE
    // ────────────────────────────────────────────────────────────────────────

    invoiceNumber:
      String(
        sale.invoiceNumber ??
        ''
      ),


    createdAt:
      (sale.createdAt as string) ??
      new Date().toISOString(),


    dueDate:
      sale.dueDate
        ? (sale.dueDate as string)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // CUSTOMER
    // ────────────────────────────────────────────────────────────────────────

    customerName,

    customerMobile,

    customerAddress,

    customerGstNumber,

    customerPanNumber,

    customerState,

    customerStateCode,

    customerFssai,


    // ────────────────────────────────────────────────────────────────────────
    // TOTALS
    // ────────────────────────────────────────────────────────────────────────

    subtotal:
      Number(
        sale.subtotal ??
        0
      ),


    discountType:
      sale.discountType === 'PERCENTAGE' ||
      sale.discountType === 'FLAT'
        ? sale.discountType
        : undefined,


    discountValue:
      sale.discountValue != null
        ? Number(sale.discountValue)
        : undefined,


    discountAmount:
      Number(
        sale.discountAmount ??
        0
      ),


    labourCost:
      Number(
        sale.labourCost ??
        0
      ),


    taxAmount:
      Number(
        sale.taxAmount ??
        0
      ),


    grandTotal:
      Number(
        sale.grandTotal ??
        0
      ),


    // ────────────────────────────────────────────────────────────────────────
    // PAYMENT
    // ────────────────────────────────────────────────────────────────────────

    paymentStatus:
      sale.paymentStatus
        ? String(sale.paymentStatus)
        : undefined,


    paymentMode:
      sale.paymentMode
        ? String(sale.paymentMode)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // GST TOTALS
    // ────────────────────────────────────────────────────────────────────────

    cgstAmount:
      sale.cgstAmount != null
        ? Number(sale.cgstAmount)
        : undefined,


    sgstAmount:
      sale.sgstAmount != null
        ? Number(sale.sgstAmount)
        : undefined,


    igstAmount:
      sale.igstAmount != null
        ? Number(sale.igstAmount)
        : undefined,


    igstApplicable:
      Boolean(
        sale.igstApplicable
      ),


    roundOff:
      sale.roundOff != null
        ? Number(sale.roundOff)
        : undefined,


    totalBoxes:
      sale.totalBoxes != null
        ? Number(sale.totalBoxes)
        : undefined,


    // ────────────────────────────────────────────────────────────────────────
    // ITEMS
    // ────────────────────────────────────────────────────────────────────────

    items:
      lineItems.map(
        (item): PrintableSaleItem => {

          // ================================================================
          // PRODUCT
          // ================================================================

          const product =
            item.product as
              | {
                  name?: string
                  sku?: string
                  hsn?: string
                  mrp?: number
                  listingPrice?: number
                }
              | undefined


          // ================================================================
          // QUANTITY / PCS
          // ================================================================

          const quantity =
            Number(
              item.quantity ??
              0
            )


          const pcs =
            item.pcs != null
              ? Number(item.pcs)
              : quantity


          // ================================================================
          // LISTING PRICE / LS
          // ================================================================
          //
          // Priority:
          //
          // 1. item.listingPrice
          // 2. product.listingPrice
          // 3. item.mrp
          // 4. product.mrp
          //
          // This allows your existing database to continue working
          // while you migrate from MRP to LS.
          // ================================================================

          const listingPrice =
            item.listingPrice != null
              ? Number(item.listingPrice)
              : product?.listingPrice != null
                ? Number(product.listingPrice)
                : item.mrp != null
                  ? Number(item.mrp)
                  : product?.mrp != null
                    ? Number(product.mrp)
                    : undefined


          // ================================================================
          // RATE
          // ================================================================
          //
          // IMPORTANT:
          //
          // Rate = LS / PCS
          //
          // Do NOT use saleRate here for the GST invoice rate.
          // ================================================================

          const calculatedRate =
            listingPrice != null &&
            pcs > 0
              ? listingPrice / pcs
              : Number(
                  item.unitPrice ??
                  item.sellingPriceAtSale ??
                  item.saleRate ??
                  0
                )


          // ================================================================
          // TOTAL PRICE
          // ================================================================

          const totalPrice =
            item.totalPrice != null
              ? Number(item.totalPrice)
              : calculatedRate * pcs


          // ================================================================
          // HSN
          // ================================================================

          const hsn =
            item.hsn != null
              ? String(item.hsn)
              : product?.hsn != null
                ? String(product.hsn)
                : undefined


          // ================================================================
          // SCHEME
          // ================================================================

          const schemePercent =
            item.schemePercent != null
              ? Number(item.schemePercent)
              : undefined


          // ================================================================
          // DISCOUNT
          // ================================================================

          const discPercent =
            item.discountPercent != null
              ? Number(item.discountPercent)
              : item.discPercent != null
                ? Number(item.discPercent)
                : undefined

          const discountAmount =
            item.discountAmount != null
              ? Number(item.discountAmount)
              : discPercent != null && discPercent > 0
                ? ((calculatedRate * quantity) * discPercent) / 100
                : undefined


          // ================================================================
          // GST
          // ================================================================

          const gstPercent =
            item.gstPercent != null
              ? Number(item.gstPercent)
              : undefined


          // ================================================================
          // RETURN ITEM
          // ================================================================

          return {

            product: {

              name:
                String(
                  item.productName ??
                  product?.name ??
                  'Item'
                ),


              sku:
                String(
                  item.sku ??
                  product?.sku ??
                  ''
                ),


              hsn,


              listingPrice,
            },


            productName:
              item.productName
                ? String(item.productName)
                : undefined,


            sku:
              item.sku
                ? String(item.sku)
                : undefined,


            quantity,


            saleRate:
              calculatedRate,


            unitPrice:
              calculatedRate,


            sellingPriceAtSale:
              item.sellingPriceAtSale != null
                ? Number(item.sellingPriceAtSale)
                : undefined,


            totalPrice,


            hsn,


            listingPrice,


            // Legacy MRP retained internally for compatibility.
            // It is NOT displayed as MRP in the new invoice.
            mrp:
              item.mrp != null
                ? Number(item.mrp)
                : product?.mrp != null
                  ? Number(product.mrp)
                  : undefined,


            pcs,


            schemePercent,


            discPercent,

            discountPercent: discPercent,

            discountAmount,


            gstPercent,
          }
        }
      ),
  }
}


// ============================================================================
// BROWSER PRINT
// ============================================================================

function printHtmlInBrowser(
  html: string
): void {

  const iframe =
    document.createElement(
      'iframe'
    )


  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:none'


  document.body.appendChild(
    iframe
  )


  const win =
    iframe.contentWindow


  if (!win) {

    document.body.removeChild(
      iframe
    )

    throw new Error(
      'Could not open print preview'
    )
  }


  const doc =
    win.document


  doc.open()

  doc.write(html)

  doc.close()


  win.focus()

  win.print()


  setTimeout(
    () => {

      document.body.removeChild(
        iframe
      )

    },
    1000
  )
}


// ============================================================================
// PRINT HTML
// ============================================================================

export async function printInvoiceHtml(
  html: string,
  template: PrintTemplate = 'THERMAL_80MM'
): Promise<void> {

  if (
    typeof window !== 'undefined' &&
    window.electron
  ) {

    const result =
      template === 'A4'
        ? await window.electron.printA4(
            html
          )
        : await window.electron.printThermal(
            html
          )


    if (!result.success) {

      throw new Error(
        result.error ??
        'Print failed'
      )
    }


    return
  }


  printHtmlInBrowser(
    html
  )
}


// ============================================================================
// BUILD INVOICE HTML
// ============================================================================

export function buildInvoiceHtml(
  sale: PrintableSale,
  settings: PrintableSettings
): string {

  return settings.printTemplate === 'A4'
    ? generateGSTInvoiceHTML(
        sale,
        settings
      )
    : generateThermalReceiptHTML(
        sale,
        settings
      )
}


// ============================================================================
// PRINT SALE
// ============================================================================

export async function printSale(
  sale: Record<string, unknown>,
  settings: Record<string, unknown>
): Promise<void> {

  const printableSale =
    normalizeSaleForPrint(
      sale
    )


  const printableSettings =
    normalizeSettingsForPrint(
      settings
    )


  const html =
    buildInvoiceHtml(
      printableSale,
      printableSettings
    )


  await printInvoiceHtml(
    html,
    printableSettings.printTemplate
  )
}


// ============================================================================
// PRINT SALE BY ID
// ============================================================================

export async function printSaleById(
  saleId: string
): Promise<void> {

  const [
    saleRes,
    settingsRes,
  ] = await Promise.all([

    fetch(
      `/api/sales/${saleId}`
    ),

    fetch(
      '/api/settings'
    ),

  ])


  const sale =
    await saleRes.json()


  const settings =
    await settingsRes.json()


  if (!saleRes.ok) {

    throw new Error(
      sale.error ??
      'Failed to load invoice for printing'
    )
  }


  if (!settingsRes.ok) {

    throw new Error(
      settings.error ??
      'Failed to load store settings for printing'
    )
  }


  await printSale(
    sale,
    settings
  )
}