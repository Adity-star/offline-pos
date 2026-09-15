import type { PrintableSale, PrintableSettings } from '@/lib/print-invoice'

// ============================================================================
// PRINT INVOICE
// ============================================================================
// GST Invoice:
// - A4 Landscape
// - 13 product columns
// - LS = Listing Price
// - Rate = LS / PCS
// - Gross Amount = LS
// - Scheme % and Discount % retained
// - Agency + Customer details in header
// - Tax + Bank + Amount Summary at bottom
// ============================================================================


// ============================================================================
// SHARED FORMATTING HELPERS
// ============================================================================

function formatMoney(value: number, symbol: string): string {
  return `${symbol}${Number(value || 0).toFixed(2)}`
}


function formatIndianNumber(value: number): string {
  if (!isFinite(value)) return '0.00'

  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}


function formatInvoiceDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}


function formatInvoiceTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}


function formatDiscountPercent(sale: PrintableSale): string {
  const subtotal = Number(sale.subtotal) || 0
  const discountAmount = Number(sale.discountAmount) || 0

  if (discountAmount <= 0) return ''

  if (
    sale.discountType === 'PERCENTAGE' &&
    sale.discountValue != null
  ) {
    return ` / ${Number(sale.discountValue).toFixed(2)}%`
  }

  if (subtotal > 0) {
    return ` / ${((discountAmount / subtotal) * 100).toFixed(2)}%`
  }

  return ''
}


// ============================================================================
// INDIAN NUMBER TO WORDS
// ============================================================================

function numberToIndianWords(amount: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]


  function twoDigits(n: number): string {
    if (n < 20) {
      return ones[n]
    }

    return `${tens[Math.floor(n / 10)]}${
      n % 10 ? ' ' + ones[n % 10] : ''
    }`
  }


  function threeDigits(n: number): string {
    const hundred = Math.floor(n / 100)
    const rest = n % 100

    let output = ''

    if (hundred) {
      output += `${ones[hundred]} Hundred`

      if (rest) {
        output += ' '
      }
    }

    if (rest) {
      output += twoDigits(rest)
    }

    return output.trim()
  }


  const rupees =
    Math.floor(Math.round(Number(amount || 0) * 100) / 100)

  if (rupees === 0) {
    return 'Rupees Zero Only'
  }


  const crore = Math.floor(rupees / 10000000)

  const lakh =
    Math.floor((rupees % 10000000) / 100000)

  const thousand =
    Math.floor((rupees % 100000) / 1000)

  const hundredPart =
    rupees % 1000


  const parts: string[] = []


  if (crore) {
    parts.push(`${threeDigits(crore)} Crore`)
  }

  if (lakh) {
    parts.push(`${threeDigits(lakh)} Lakh`)
  }

  if (thousand) {
    parts.push(`${threeDigits(thousand)} Thousand`)
  }

  if (hundredPart) {
    parts.push(threeDigits(hundredPart))
  }


  return `Rupees ${parts.join(' ')} Only`
}


// ============================================================================
// THERMAL RECEIPT
// ============================================================================

function renderThermalLineItems(
  sale: PrintableSale
): string {
  return sale.items
    .map((item) => {
      const name =
        item.product?.name ??
        item.productName ??
        'Item'

      const sku = item.product?.sku ?? item.sku ?? ''
      
      // Use listing price if available, otherwise use sale rate
      const listingPrice = Number(item.listingPrice ?? item.mrp ?? 0)
      const rate = Number(item.saleRate ?? item.unitPrice ?? listingPrice)
      
      const qty = item.quantity
      const gross = rate * qty

      const discPct = Number(item.discountPercent ?? item.discPercent ?? 0)
      const discAmt = Number(item.discountAmount ?? (discPct > 0 ? (gross * discPct) / 100 : 0))

      const lineTotal =
        Number(
          item.totalPrice ??
          (gross - discAmt)
        )

      return `
        <tr>
          <td class="item-name">
            <div style="font-weight: 600;">${name}</div>
            ${sku ? `<div style="font-size: 9px; color: #666;">SKU: ${sku}</div>` : ''}
            ${
              discAmt > 0
                ? `<div style="font-size: 9px; color: #dc2626;">Disc: ${discPct}% (-${discAmt.toFixed(2)})</div>`
                : ''
            }
          </td>

          <td class="text-center">
            ${qty}
          </td>

          <td class="text-right">
            ${rate.toFixed(2)}
          </td>

          <td class="text-right">
            ${lineTotal.toFixed(2)}
          </td>
        </tr>
      `
    })
    .join('')
}


export const generateThermalReceiptHTML = (
  sale: PrintableSale,
  settings: PrintableSettings
) => {

  const symbol =
    settings.currencySymbol || '₹'


  // Calculate accurate totals from items
  let calculatedSubtotal = 0
  let calculatedDiscount = 0
  
  sale.items.forEach(item => {
    const rate = Number(item.saleRate ?? item.unitPrice ?? item.listingPrice ?? 0)
    const qty = item.quantity
    const gross = rate * qty
    const discPct = Number(item.discountPercent ?? item.discPercent ?? 0)
    const discAmt = Number(item.discountAmount ?? (discPct > 0 ? (gross * discPct) / 100 : 0))
    
    calculatedSubtotal += gross
    calculatedDiscount += discAmt
  })

  const subtotal = Number(sale.subtotal) || calculatedSubtotal
  const discountAmount = Number(sale.discountAmount) || calculatedDiscount
  const gstAmount = Number(sale.taxAmount) || Number(sale.labourCost) || 0
  const grandTotal = Number(sale.grandTotal) || (subtotal - discountAmount + gstAmount)


  return `
<!DOCTYPE html>

<html>

<head>

  <meta charset="utf-8">

  <title>
    Receipt - ${sale.invoiceNumber}
  </title>


  <style>

    body {
      font-family:
        'Helvetica Neue',
        Helvetica,
        Arial,
        sans-serif;

      width: 80mm;

      margin: 0;

      padding: 5mm;

      font-size: 12px;

      line-height: 1.4;

      color: #000;
    }


    .text-center {
      text-align: center;
    }


    .text-right {
      text-align: right;
    }


    .border-bottom {
      border-bottom: 1px dashed #000;

      margin-bottom: 5px;

      padding-bottom: 5px;
    }


    .store-name {
      font-size: 18px;

      font-weight: bold;

      text-transform: uppercase;

      margin-bottom: 2px;
    }


    table {
      width: 100%;

      border-collapse: collapse;

      margin: 10px 0;
    }


    th,
    td {
      padding: 4px 0;

      text-align: left;
    }


    th {
      border-bottom: 1px solid #000;
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
    }


    .item-name {
      max-width: 40mm;

      word-wrap: break-word;
    }


    .totals-row {
      display: flex;

      justify-content: space-between;

      margin-bottom: 3px;
    }


    .grand-total {
      font-size: 16px;

      font-weight: bold;

      margin-top: 5px;

      padding-top: 5px;

      border-top: 1px dashed #000;
    }


    .footer {
      font-size: 10px;

      margin-top: 15px;

      text-align: center;
    }

  </style>

</head>


<body>


  <div class="text-center border-bottom">

    <div class="store-name">
      ${settings.storeName || 'MY STORE'}
    </div>

    ${
      settings.storeAddress
        ? `<div style="font-size: 10px;">${settings.storeAddress}</div>`
        : ''
    }

    ${
      settings.storeCity
        ? `<div style="font-size: 10px;">${settings.storeCity}</div>`
        : ''
    }

    ${
      settings.storeMobile
        ? `<div style="font-size: 10px;">Ph: ${settings.storeMobile}</div>`
        : ''
    }

    ${
      settings.gstNumber
        ? `<div style="font-size: 10px;">GSTIN: ${settings.gstNumber}</div>`
        : ''
    }

  </div>


  <div class="border-bottom">

    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <div>
        <strong>Date:</strong>
        ${new Date(sale.createdAt).toLocaleString('en-IN')}
      </div>
      <div>
        <strong>Bill No:</strong>
        ${sale.invoiceNumber}
      </div>
    </div>

    <div>
      <strong>Customer:</strong>
      ${sale.customerName || 'Walk-in'}
    </div>

    ${
      sale.customerMobile
        ? `
          <div>
            <strong>Mobile:</strong>
            ${sale.customerMobile}
          </div>
        `
        : ''
    }

  </div>


  <table>

    <thead>

      <tr>

        <th style="width: 45%;">
          Item
        </th>

        <th class="text-center" style="width: 15%;">
          Qty
        </th>

        <th class="text-right" style="width: 20%;">
          Rate
        </th>

        <th class="text-right" style="width: 20%;">
          Total
        </th>

      </tr>

    </thead>


    <tbody>

      ${renderThermalLineItems(sale)}

    </tbody>

  </table>


  <div class="border-bottom text-right">

    <div class="totals-row">

      <span>
        Subtotal:
      </span>

      <span>
        ${formatMoney(subtotal, symbol)}
      </span>

    </div>


    ${
      discountAmount > 0
        ? `
          <div class="totals-row">

            <span>
              Discount:
            </span>

            <span style="color: #dc2626;">
              -${formatMoney(discountAmount, symbol)}
              ${formatDiscountPercent(sale)}
            </span>

          </div>
        `
        : ''
    }


    ${
      gstAmount > 0
        ? `
          <div class="totals-row">

            <span>
              GST (${Number(sale.gstPercentage || 0)}%):
            </span>

            <span>
              +${formatMoney(gstAmount, symbol)}
            </span>

          </div>
        `
        : ''
    }


    <div class="totals-row grand-total">

      <span>
        Grand Total:
      </span>

      <span>
        ${formatMoney(grandTotal, symbol)}
      </span>

    </div>

    ${
      sale.paymentStatus && sale.paymentStatus !== 'PAID'
        ? `
          <div class="totals-row" style="margin-top: 3px; color: #dc2626;">
            <span>
              Status:
            </span>

            <span>
              ${sale.paymentStatus}
            </span>

          </div>
        `
        : ''
    }

  </div>


  <div class="footer">

    ${
      settings.termsConditions
        ? `
          <div style="margin-bottom: 5px;">
            ${settings.termsConditions.replace(
              /\n/g,
              '<br/>'
            )}
          </div>
        `
        : ''
    }

    ${
      settings.bankName || settings.bankAccountNumber || settings.bankIfsc
        ? `
          <div style="margin-bottom: 5px; border-top: 1px dashed #000; padding-top: 5px;">
            <div style="font-weight: bold; margin-bottom: 2px;">Bank Details:</div>
            ${
              settings.bankName
                ? `<div>${settings.bankName}</div>`
                : ''
            }
            ${
              settings.bankAccountNumber
                ? `<div>A/c: ${settings.bankAccountNumber}</div>`
                : ''
            }
            ${
              settings.bankIfsc
                ? `<div>IFSC: ${settings.bankIfsc}</div>`
                : ''
            }
            ${
              settings.bankBranch
                ? `<div>Branch: ${settings.bankBranch}</div>`
                : ''
            }
          </div>
        `
        : ''
    }

    <div>
      Thank you for your business!
    </div>

  </div>


</body>

</html>
`
}


// ============================================================================
// GST LINE ITEMS
// ============================================================================
//
// PRODUCT TABLE:
//
// Sr | HSN | Product Name | LS | PCS | Rate | Gross | Scheme % |
// Disc % | Taxable | GST % | GST Amount | Net Amount
//
// LS = Listing Price
// Rate = LS / PCS
// Gross = Rate * PCS = LS
// ============================================================================

function renderGstLineItems(
  sale: PrintableSale
): string {

  return sale.items
    .map((item, idx) => {

      const itemWithListingPrice =
        item as typeof item & {
          listingPrice?: number | string | null
        }


      const name =
        item.product?.name ??
        item.productName ??
        'Item'


      const hsn =
        item.hsn ?? ''


      // ==========================================================
      // LISTING PRICE
      // ==========================================================
      //
      // New field:
      //   listingPrice
      //
      // Backward compatibility:
      //   mrp
      //
      // The PDF displays this as LS.
      // ==========================================================

      const listingPrice =
        Number(
          itemWithListingPrice.listingPrice ??
          item.mrp ??
          0
        )


      // ==========================================================
      // PCS
      // ==========================================================

      const pcs =
        Number(
          item.pcs ??
          item.quantity ??
          0
        )


      // ==========================================================
      // RATE = LS / PCS
      // ==========================================================

      const rate =
        pcs > 0
          ? listingPrice / pcs
          : 0


      // ==========================================================
      // GROSS = RATE × PCS
      // ==========================================================

      const grossAmount =
        rate * pcs


      // ==========================================================
      // SCHEME
      // ==========================================================

      const schemePercent =
        Number(
          item.schemePercent ?? 0
        )


      const schemeAmount =
        schemePercent > 0
          ? (
              grossAmount *
              schemePercent
            ) / 100
          : 0


      // ==========================================================
      // DISCOUNT
      // ==========================================================

      const discPercent =
        Number(
          item.discountPercent ?? item.discPercent ?? 0
        )


      const discAmount =
        item.discountAmount != null
          ? Number(item.discountAmount)
          : discPercent > 0
            ? (
                grossAmount *
                discPercent
              ) / 100
            : 0


      // ==========================================================
      // TAXABLE
      // ==========================================================

      const taxableAmount =
        Math.max(
          0,
          grossAmount -
          schemeAmount -
          discAmount
        )


      // ==========================================================
      // GST
      // ==========================================================

      const gstPercent =
        Number(
          item.gstPercent ?? 18
        )


      const gstAmount =
        (
          taxableAmount *
          gstPercent
        ) / 100


      // ==========================================================
      // NET
      // ==========================================================
      //
      // As in the reference layout, Net Amount is the taxable
      // line amount. GST is separately shown/rolled up.
      // ==========================================================

      const netAmount =
        taxableAmount


      return `
        <tr>

          <td class="col-sr">
            ${idx + 1}
          </td>


          <td class="col-hsn">
            ${hsn}
          </td>


          <td class="col-desc">
            ${name}
          </td>


          <td class="col-ls">
            ${listingPrice.toFixed(2)}
          </td>


          <td class="col-pcs">
            ${pcs.toFixed(2)}
          </td>


          <td class="col-rate">
            ${rate.toFixed(2)}
          </td>


          <td class="col-gross">
            ${grossAmount.toFixed(2)}
          </td>


          <td class="col-scheme">

            ${
              schemePercent > 0
                ? schemePercent.toFixed(2)
                : ''
            }

          </td>


          <td class="col-disc">

            ${
              discPercent > 0
                ? `${discPercent.toFixed(2)}%`
                : ''
            }

          </td>


          <td class="col-taxable">
            ${taxableAmount.toFixed(2)}
          </td>


          <td class="col-gstpct">
            ${gstPercent.toFixed(2)}
          </td>


          <td class="col-gstamt">
            ${gstAmount.toFixed(2)}
          </td>


          <td class="col-net">
            ${netAmount.toFixed(2)}
          </td>

        </tr>
      `
    })
    .join('')
}


// ============================================================================
// GST TAX INVOICE
// ============================================================================

export const generateGSTInvoiceHTML = (
  sale: PrintableSale,
  settings: PrintableSettings
) => {

  const symbol =
    settings.currencySymbol || '₹'


  // ========================================================================
  // TOTAL CALCULATIONS
  // ========================================================================

  let grossTotal = 0

  let schemeTotal = 0

  let discountTotal = 0

  let taxableTotal = 0

  let gstTotal = 0

  let qtyTotal = 0


  sale.items.forEach((item) => {

    const itemWithListingPrice =
      item as typeof item & {
        listingPrice?: number | string | null
      }


    // ==========================================================
    // LS
    // ==========================================================

    const listingPrice =
      Number(
        itemWithListingPrice.listingPrice ??
        item.mrp ??
        0
      )


    // ==========================================================
    // PCS
    // ==========================================================

    const pcs =
      Number(
        item.pcs ??
        item.quantity ??
        0
      )


    // ==========================================================
    // RATE = LS / PCS
    // ==========================================================

    const rate =
      pcs > 0
        ? listingPrice / pcs
        : 0


    // ==========================================================
    // GROSS = RATE × PCS
    // ==========================================================

    const grossAmount =
      rate * pcs


    // ==========================================================
    // SCHEME
    // ==========================================================

    const schemePercent =
      Number(
        item.schemePercent ?? 0
      )


    const schemeAmount =
      schemePercent > 0
        ? (
            grossAmount *
            schemePercent
          ) / 100
        : 0


    // ==========================================================
    // DISCOUNT
    // ==========================================================

    const discPercent =
      Number(
        item.discPercent ?? 0
      )


    const discountAmount =
      discPercent > 0
        ? (
            grossAmount *
            discPercent
          ) / 100
        : 0


    // ==========================================================
    // TAXABLE
    // ==========================================================

    const taxableAmount =
      Math.max(
        0,
        grossAmount -
        schemeAmount -
        discountAmount
      )


    // ==========================================================
    // GST
    // ==========================================================

    const gstPercent =
      Number(
        item.gstPercent ?? 18
      )


    const gstAmount =
      (
        taxableAmount *
        gstPercent
      ) / 100


    // ==========================================================
    // TOTALS
    // ==========================================================

    grossTotal += grossAmount

    schemeTotal += schemeAmount

    discountTotal += discountAmount

    taxableTotal += taxableAmount

    gstTotal += gstAmount

    qtyTotal += pcs

  })


  // ========================================================================
  // GST SPLIT
  // ========================================================================

  const cgst =
    Number(
      sale.cgstAmount ??
      (
        sale.igstApplicable
          ? 0
          : gstTotal / 2
      )
    )


  const sgst =
    Number(
      sale.sgstAmount ??
      (
        sale.igstApplicable
          ? 0
          : gstTotal / 2
      )
    )


  const igst =
    Number(
      sale.igstAmount ??
      (
        sale.igstApplicable
          ? gstTotal
          : 0
      )
    )


  // ========================================================================
  // TOTAL
  // ========================================================================

  const calculatedTotal =
    taxableTotal + gstTotal


  const storedGrandTotal =
    Number(sale.grandTotal)


  const netPayable =
    storedGrandTotal > 0
      ? storedGrandTotal
      : calculatedTotal


  const calculatedRoundOff =
    netPayable -
    calculatedTotal


  const roundOff =
    sale.roundOff != null
      ? Number(sale.roundOff)
      : calculatedRoundOff


  // ========================================================================
  // DATES
  // ========================================================================

  const invoiceDate =
    formatInvoiceDate(
      sale.createdAt
    )


  const dueDate =
    sale.dueDate
      ? formatInvoiceDate(
          sale.dueDate
        )
      : invoiceDate


  // ========================================================================
  // CUSTOMER STATE
  // ========================================================================

  const saleWithCustomerState =
    sale as PrintableSale & {
      customerState?: string | null
    }


  const customerState =
    saleWithCustomerState.customerState ||
    ''


  // ========================================================================
  // FIRST GST RATE
  // ========================================================================

  const firstGstPercent =
    Number(
      sale.items[0]?.gstPercent ?? 18
    )


  // ========================================================================
  // HTML
  // ========================================================================

  return `
<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="utf-8" />

  <title>
    GST Invoice - ${sale.invoiceNumber}
  </title>


  <style>

    /* ================================================================
       PAGE
       ================================================================ */

    @page {
      size: A4 landscape;
      margin: 5mm;
    }


    @media print {

      @page {
        size: A4 landscape;
        margin: 5mm;
      }


      html,
      body {
        width: 297mm;
        height: 210mm;
      }

    }


    /* ================================================================
       GLOBAL
       ================================================================ */

    * {
      box-sizing: border-box;

      -webkit-print-color-adjust: exact;

      print-color-adjust: exact;
    }


    html,
    body {

      margin: 0;

      padding: 0;

      width: 100%;

      background: #fff;

      color: #000;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 9px;

      line-height: 1.2;

    }


    body {
      overflow: hidden;
    }


    /* ================================================================
       MAIN PAGE
       ================================================================ */

    .invoice-page {

      width: 100%;

      height: 200mm;

      border: 1px solid #000;

      display: flex;

      flex-direction: column;

      background: #fff;

    }


    /* ================================================================
       HEADER
       ================================================================ */

    .header-row {

      width: 100%;

      display: flex;

      border-bottom: 1px solid #000;

    }


    .header-col {

      padding: 6px 8px;

      min-height: 31mm;

    }


    .header-col.seller {

      width: 36%;

      border-right: 1px solid #000;

    }


    .header-col.center {

      width: 28%;

      border-right: 1px solid #000;

      text-align: center;

    }


    .header-col.party {

      width: 36%;

    }


    /* ================================================================
       SELLER
       ================================================================ */

    .seller-name {

      font-size: 16px;

      font-weight: 700;

      text-transform: uppercase;

      margin-bottom: 4px;

    }


    .seller-line {

      font-size: 9px;

      line-height: 1.35;

      margin-top: 2px;

    }


    /* ================================================================
       CENTER
       ================================================================ */

    .gst-title {

      font-size: 16px;

      font-weight: 700;

      letter-spacing: 0.4px;

      margin-bottom: 3px;

    }


    .original-label {

      font-weight: 700;

      margin-bottom: 5px;

    }


    .inv-meta-row {

      display: flex;

      justify-content: space-between;

      gap: 8px;

      margin-top: 4px;

      font-size: 9px;

      text-align: left;

    }


    .inv-meta-row .label {

      font-weight: 700;

    }


    /* ================================================================
       CUSTOMER
       ================================================================ */

    .party-label {

      font-size: 10px;

      font-weight: 700;

      text-decoration: underline;

      margin-bottom: 3px;

    }


    .party-name {

      font-weight: 700;

      font-size: 11px;

      margin-bottom: 2px;

    }


    .party-line {

      font-size: 9px;

      line-height: 1.35;

      margin-top: 2px;

    }


    /* ================================================================
       PRODUCT TABLE
       ================================================================ */

    .items-table {

      width: 100%;

      border-collapse: collapse;

      table-layout: fixed;

      margin: 0;

    }


    .items-table th,
    .items-table td {

      border: 1px solid #000;

      padding: 3px 3px;

      font-size: 8px;

      line-height: 1.15;

      vertical-align: middle;

      overflow: hidden;

      word-wrap: break-word;

    }


    .items-table thead th {

      font-weight: 700;

      text-align: center;

      height: 10mm;

      background: #fff;

      line-height: 1.1;

    }


    .items-table tbody td {

      height: 6mm;

    }


    .items-table tbody {

      height: 94mm;

    }


    .items-table tfoot td {

      font-weight: 700;

      padding: 3px;

      height: 6mm;

    }


    /* ================================================================
       13 PRODUCT COLUMNS
       ================================================================ */

    .col-sr {

      width: 4%;

      text-align: center;

    }


    .col-hsn {

      width: 7%;

      text-align: center;

    }


    .col-desc {

      width: 24%;

      text-align: left;

    }


    .col-ls {

      width: 8%;

      text-align: right;

    }


    .col-pcs {

      width: 6%;

      text-align: center;

    }


    .col-rate {

      width: 8%;

      text-align: right;

    }


    .col-gross {

      width: 9%;

      text-align: right;

    }


    .col-scheme {

      width: 6%;

      text-align: center;

    }


    .col-disc {

      width: 6%;

      text-align: center;

    }


    .col-taxable {

      width: 9%;

      text-align: right;

    }


    .col-gstpct {

      width: 4%;

      text-align: center;

    }


    .col-gstamt {

      width: 7%;

      text-align: right;

    }


    .col-net {

      width: 8%;

      text-align: right;

    }


    /* ================================================================
       SUMMARY
       ================================================================ */

    .summary-row {

      width: 100%;

      display: flex;

      border-top: 1px solid #000;

      min-height: 31mm;

    }


    .summary-col {

      padding: 5px 7px;

    }


    .summary-col.tax {

      width: 34%;

      border-right: 1px solid #000;

    }


    .summary-col.bank {

      width: 33%;

      border-right: 1px solid #000;

    }


    .summary-col.totals {

      width: 33%;

    }


    /* ================================================================
       SECTION TITLES
       ================================================================ */

    .section-title {

      font-size: 9px;

      font-weight: 700;

      text-transform: uppercase;

      padding-bottom: 3px;

      margin-bottom: 3px;

      border-bottom: 1px solid #000;

    }


    /* ================================================================
       TAX TABLE
       ================================================================ */

    .tax-table {

      width: 100%;

      border-collapse: collapse;

      table-layout: fixed;

      margin-bottom: 4px;

    }


    .tax-table th,
    .tax-table td {

      border: 1px solid #000;

      padding: 3px;

      font-size: 7px;

      text-align: right;

    }


    .tax-table th {

      font-weight: 700;

      text-align: center;

    }


    .tax-table td:first-child {

      text-align: center;

    }


    /* ================================================================
       BANK DETAILS
       ================================================================ */

    .bank-line {

      font-size: 8px;

      line-height: 1.4;

      margin-bottom: 2px;

    }


    /* ================================================================
       AMOUNT SUMMARY
       ================================================================ */

    .totals-line {

      display: flex;

      justify-content: space-between;

      gap: 6px;

      font-size: 8px;

      line-height: 1.35;

      min-height: 3.7mm;

    }


    .totals-line span:last-child {

      text-align: right;

      white-space: nowrap;

    }


    .net-payable {

      border-top: 1px solid #000;

      margin-top: 2px;

      padding-top: 3px;

      font-weight: 700;

      font-size: 10px;

    }


    /* ================================================================
       WORDS
       ================================================================ */

    .words-row {

      border-top: 1px solid #000;

      padding: 5px 8px;

      min-height: 8mm;

      font-size: 8px;

      font-weight: 700;

    }


    /* ================================================================
       TERMS
       ================================================================ */

    .terms-row {

      border-top: 1px solid #000;

      padding: 4px 8px;

      min-height: 12mm;

      font-size: 7.5px;

      line-height: 1.3;

    }


    .terms-title {

      font-weight: 700;

      margin-bottom: 2px;

    }


    /* ================================================================
       SIGNATURE
       ================================================================ */

    .sign-row {

      display: flex;

      justify-content: space-between;

      align-items: flex-end;

      padding: 4px 10px 4px;

      min-height: 14mm;

      font-size: 8px;

    }


    .sign-box {

      width: 180px;

      text-align: center;

    }


    .sign-line {

      margin-top: 9mm;

      border-top: 1px solid #000;

      padding-top: 2px;

    }


    /* ================================================================
       PRINT
       ================================================================ */

    .invoice-page,
    .header-row,
    .items-table,
    .summary-row,
    .words-row,
    .terms-row,
    .sign-row {

      break-inside: avoid;

      page-break-inside: avoid;

    }

  </style>

</head>


<body>


<div class="invoice-page">


  <!-- ==============================================================
       HEADER
       ============================================================== -->

  <div class="header-row">


    <!-- ============================================================
         AGENCY
         ============================================================ -->

    <div class="header-col seller">

      <div class="seller-name">

        ${
          settings.storeName ||
          'JAI HANUMAN AGENCY'
        }

      </div>


      ${
        settings.storeAddress
          ? `
            <div class="seller-line">
              <strong>Address:</strong>
              ${settings.storeAddress}
            </div>
          `
          : ''
      }


      ${
        settings.storeCity
          ? `
            <div class="seller-line">
              ${settings.storeCity}
            </div>
          `
          : ''
      }


      ${
        settings.storeMobile
          ? `
            <div class="seller-line">
              <strong>Phone:</strong>
              ${settings.storeMobile}
            </div>
          `
          : ''
      }


      <div class="seller-line">

        <strong>GSTIN No:</strong>

        ${settings.gstNumber || ''}

      </div>


      <div class="seller-line">

        <strong>PAN No:</strong>

        ${settings.panNumber || ''}

      </div>


      <div class="seller-line">

        <strong>State:</strong>

        ${settings.stateName || ''}

        ${
          settings.stateCode
            ? ` (${settings.stateCode})`
            : ''
        }

      </div>


      ${
        settings.fssaiNumber
          ? `
            <div class="seller-line">

              <strong>FSSAI:</strong>

              ${settings.fssaiNumber}

            </div>
          `
          : ''
      }

    </div>


    <!-- ============================================================
         INVOICE
         ============================================================ -->

    <div class="header-col center">


      <div class="gst-title">
        GST INVOICE
      </div>


      <div class="original-label">
        Original
      </div>


      <div class="inv-meta-row">

        <span class="label">
          Invoice No.
        </span>

        <span>
          ${sale.invoiceNumber}
        </span>

      </div>


      <div class="inv-meta-row">

        <span class="label">
          Invoice Date
        </span>

        <span>
          ${invoiceDate}
        </span>

      </div>


      <div class="inv-meta-row">

        <span class="label">
          Due Date
        </span>

        <span>
          ${dueDate}
        </span>

      </div>


    </div>


    <!-- ============================================================
         CUSTOMER
         ============================================================ -->

    <div class="header-col party">


      <div class="party-label">
        CUSTOMER / PARTY
      </div>


      <div class="party-name">

        ${
          sale.customerName ||
          'Walk-in Customer'
        }

      </div>


      ${
        sale.customerAddress
          ? `
            <div class="party-line">

              <strong>Address:</strong>

              ${sale.customerAddress}

            </div>
          `
          : ''
      }


      ${
        sale.customerMobile
          ? `
            <div class="party-line">

              <strong>Phone:</strong>

              ${sale.customerMobile}

            </div>
          `
          : ''
      }


      ${
        sale.customerGstNumber
          ? `
            <div class="party-line">

              <strong>GSTIN No:</strong>

              ${sale.customerGstNumber}

            </div>
          `
          : ''
      }


      ${
        customerState
          ? `
            <div class="party-line">

              <strong>State:</strong>

              ${customerState}

            </div>
          `
          : ''
      }


      ${
        sale.customerFssai
          ? `
            <div class="party-line">

              <strong>FSSAI:</strong>

              ${sale.customerFssai}

            </div>
          `
          : ''
      }


    </div>


  </div>


  <!-- ==============================================================
       PRODUCT TABLE
       ============================================================== -->

  <table class="items-table">


    <colgroup>

      <col class="col-sr">

      <col class="col-hsn">

      <col class="col-desc">

      <col class="col-ls">

      <col class="col-pcs">

      <col class="col-rate">

      <col class="col-gross">

      <col class="col-scheme">

      <col class="col-disc">

      <col class="col-taxable">

      <col class="col-gstpct">

      <col class="col-gstamt">

      <col class="col-net">

    </colgroup>


    <thead>

      <tr>

        <th>
          Sr.
        </th>


        <th>
          HSN
        </th>


        <th>
          Product<br>
          Name
        </th>


        <th>
          LS
        </th>


        <th>
          PCS
        </th>


        <th>
          Rate
        </th>


        <th>
          Gross<br>
          Amount
        </th>


        <th>
          Scheme<br>
          %
        </th>


        <th>
          Disc<br>
          %
        </th>


        <th>
          Taxable<br>
          Amount
        </th>


        <th>
          GST<br>
          %
        </th>


        <th>
          GST<br>
          Amount
        </th>


        <th>
          Net<br>
          Amount
        </th>

      </tr>

    </thead>


    <tbody>

      ${renderGstLineItems(sale)}

    </tbody>


    <tfoot>

      <tr>

        <td colspan="4">
          TOTAL
        </td>


        <td style="text-align:center;">
          ${qtyTotal.toFixed(2)}
        </td>


        <td></td>


        <td style="text-align:right;">
          ${formatIndianNumber(grossTotal)}
        </td>


        <td style="text-align:center;">
          ${
            schemeTotal > 0
              ? formatIndianNumber(
                  schemeTotal
                )
              : ''
          }
        </td>


        <td style="text-align:center;">
          ${
            discountTotal > 0
              ? formatIndianNumber(
                  discountTotal
                )
              : ''
          }
        </td>


        <td style="text-align:right;">
          ${formatIndianNumber(taxableTotal)}
        </td>


        <td></td>


        <td style="text-align:right;">
          ${formatIndianNumber(gstTotal)}
        </td>


        <td style="text-align:right;">
          ${formatIndianNumber(taxableTotal)}
        </td>

      </tr>

    </tfoot>


  </table>


  <!-- ==============================================================
       BOTTOM SUMMARY
       ============================================================== -->

  <div class="summary-row">


    <!-- ============================================================
         TAX DETAILS
         ============================================================ -->

    <div class="summary-col tax">


      <div class="section-title">
        TAX DETAILS
      </div>


      <table class="tax-table">


        <thead>

          <tr>

            <th>
              Tax %
            </th>

            <th>
              Taxable
            </th>

            <th>
              Tax Amt
            </th>

            <th>
              CGST
            </th>

            <th>
              SGST
            </th>

            <th>
              IGST
            </th>

          </tr>

        </thead>


        <tbody>

          <tr>

            <td>
              ${firstGstPercent.toFixed(2)}
            </td>

            <td>
              ${formatIndianNumber(
                taxableTotal
              )}
            </td>

            <td>
              ${formatIndianNumber(
                gstTotal
              )}
            </td>

            <td>
              ${formatIndianNumber(
                cgst
              )}
            </td>

            <td>
              ${formatIndianNumber(
                sgst
              )}
            </td>

            <td>
              ${formatIndianNumber(
                igst
              )}
            </td>

          </tr>

        </tbody>

      </table>


      <div class="bank-line">

        <strong>Total Tax:</strong>

        ${formatMoney(
          gstTotal,
          symbol
        )}

      </div>


      <div class="bank-line">

        <strong>CGST:</strong>

        ${formatMoney(
          cgst,
          symbol
        )}

      </div>


      <div class="bank-line">

        <strong>SGST:</strong>

        ${formatMoney(
          sgst,
          symbol
        )}

      </div>


      ${
        igst > 0
          ? `
            <div class="bank-line">

              <strong>IGST:</strong>

              ${formatMoney(
                igst,
                symbol
              )}

            </div>
          `
          : ''
      }


    </div>


    <!-- ============================================================
         BANK DETAILS
         ============================================================ -->

    <div class="summary-col bank">


      <div class="section-title">
        BANK DETAILS
      </div>


      ${
        settings.bankName
          ? `
            <div class="bank-line">

              <strong>Bank Name:</strong>

              ${settings.bankName}

            </div>
          `
          : ''
      }


      ${
        settings.bankAccountName
          ? `
            <div class="bank-line">

              <strong>Account Name:</strong>

              ${settings.bankAccountName}

            </div>
          `
          : ''
      }


      ${
        settings.bankAccountNumber
          ? `
            <div class="bank-line">

              <strong>A/c No:</strong>

              ${settings.bankAccountNumber}

            </div>
          `
          : ''
      }


      ${
        settings.bankIfsc
          ? `
            <div class="bank-line">

              <strong>IFSC Code:</strong>

              ${settings.bankIfsc}

            </div>
          `
          : ''
      }


      ${
        settings.bankBranch
          ? `
            <div class="bank-line">

              <strong>Branch:</strong>

              ${settings.bankBranch}

            </div>
          `
          : ''
      }


    </div>


    <!-- ============================================================
         AMOUNT SUMMARY
         ============================================================ -->

    <div class="summary-col totals">


      <div class="section-title">
        AMOUNT SUMMARY
      </div>


      <div class="totals-line">

        <span>
          Gross Amount
        </span>

        <span>
          ${formatMoney(
            grossTotal,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          Total Scheme
        </span>

        <span>
          ${formatMoney(
            schemeTotal,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          Total Discount
        </span>

        <span>
          ${formatMoney(
            discountTotal,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          Taxable Amount
        </span>

        <span>
          ${formatMoney(
            taxableTotal,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          GST Amount
        </span>

        <span>
          ${formatMoney(
            gstTotal,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          Other
        </span>

        <span>
          ${formatMoney(
            0,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          Cash Discount
        </span>

        <span>
          ${formatMoney(
            0,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line">

        <span>
          Round Off
        </span>

        <span>
          ${formatMoney(
            roundOff,
            symbol
          )}
        </span>

      </div>


      <div class="totals-line net-payable">

        <span>
          NET PAYABLE AMOUNT
        </span>

        <span>
          ${formatMoney(
            netPayable,
            symbol
          )}
        </span>

      </div>


    </div>


  </div>


  <!-- ==============================================================
       AMOUNT IN WORDS
       ============================================================== -->

  <div class="words-row">

    <strong>
      Invoice Value [ In Words ] :
    </strong>

    ${numberToIndianWords(
      netPayable
    )}

  </div>


  <!-- ==============================================================
       TERMS
       ============================================================== -->

  <div class="terms-row">


    <div class="terms-title">

      Terms &amp; Conditions

    </div>


    <div>

      ${
        settings.termsConditions
          ? settings.termsConditions.replace(
              /\n/g,
              '<br/>'
            )
          : 'Goods once sold will not be taken or exchanged.'
      }

    </div>


    ${
      settings.jurisdictionText
        ? `
          <div>
            ${settings.jurisdictionText}
          </div>
        `
        : ''
    }


    <div>
      Narration :
    </div>


  </div>


  <!-- ==============================================================
       SIGNATURE
       ============================================================== -->

  <div class="sign-row">


    <div class="sign-box">

      <div class="sign-line">
        Receiver's Signatory
      </div>

    </div>


    <div class="sign-box">

      <div class="sign-line">

        ${
          settings.storeName ||
          'Authorised Signatory'
        }

        <br>

        Authorised Signatory

      </div>

    </div>


  </div>


</div>


</body>

</html>
`
}