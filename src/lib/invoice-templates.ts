import type { PrintableSale, PrintableSettings } from '@/lib/print-invoice'

// ============================================================================
// PRINT INVOICE
// ============================================================================
// GST Invoice:
// - A4 Landscape
// - 12 product columns
// - LS = Listing Price
// - Rate = LS / PCS
// - Gross Amount = LS
// - Scheme % retained
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

    return `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''
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

      const lineTotal =
        Number(
          item.totalPrice ??
          gross
        )

      return `
        <tr>
          <td class="item-name">
            <div style="font-weight: 600;">${name}</div>
            ${sku ? `<div style="font-size: 9px; color: #666;">SKU: ${sku}</div>` : ''}
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

  sale.items.forEach(item => {
    const rate = Number(item.saleRate ?? item.unitPrice ?? item.listingPrice ?? 0)
    const qty = item.quantity
    const gross = rate * qty

    calculatedSubtotal += gross
  })

  const subtotal = Number(sale.subtotal) || calculatedSubtotal
  const gstAmount = Number(sale.taxAmount) || Number(sale.labourCost) || 0
  const grandTotal = Number(sale.grandTotal) || (subtotal + gstAmount)


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

      font-size: 13px;

      line-height: 1.5;

      color: #000;
    }


    .text-center {
      text-align: center;
    }


    .text-right {
      text-align: right;
    }


    .border-bottom {
      border-bottom: 2px dashed #000;

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
      border-bottom: 2px solid #000;
      font-weight: bold;
      font-size: 11px;
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
      font-size: 18px;

      font-weight: bold;

      margin-top: 5px;

      padding-top: 5px;

      border-top: 2px dashed #000;
    }


    .footer {
      font-size: 10px;

      margin-top: 15px;

      text-align: center;
    }


    .qr-code {
      width: 60px;
      height: 60px;
      margin: 5px auto;
      display: block;
      border: 1px solid #000;
    }

  </style>

</head>


<body>


  <div class="text-center border-bottom">

    <div class="store-name">
      ${settings.storeName || 'MY STORE'}
    </div>

    ${settings.storeAddress
      ? `<div style="font-size: 10px;">${settings.storeAddress}</div>`
      : ''
    }

    ${settings.storeCity
      ? `<div style="font-size: 10px;">${settings.storeCity}</div>`
      : ''
    }

    ${settings.storeMobile
      ? `<div style="font-size: 10px;">Ph: ${settings.storeMobile}</div>`
      : ''
    }

    ${settings.gstNumber
      ? `<div style="font-size: 10px;">GSTIN: ${settings.gstNumber}</div>`
      : ''
    }

    <img src="./qrcode.jpg" alt="Payment QR Code" class="qr-code" />
    <div style="font-size: 8px; margin-top: 2px;">Scan to Pay</div>

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

    ${sale.customerMobile
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





    ${gstAmount > 0
      ? `
          <div class="totals-row">

            <span>
              GST:
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

    ${sale.paymentStatus && sale.paymentStatus !== 'PAID'
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

    ${settings.termsConditions
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

    ${settings.bankName || settings.bankAccountNumber || settings.bankIfsc
      ? `
          <div style="margin-bottom: 5px; border-top: 1px dashed #000; padding-top: 5px;">
            <div style="font-weight: bold; margin-bottom: 2px;">Bank Details:</div>
            ${settings.bankName
        ? `<div>${settings.bankName}</div>`
        : ''
      }
            ${settings.bankAccountNumber
        ? `<div>A/c: ${settings.bankAccountNumber}</div>`
        : ''
      }
            ${settings.bankIfsc
        ? `<div>IFSC: ${settings.bankIfsc}</div>`
        : ''
      }
            ${settings.bankBranch
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
// Taxable | GST % | GST Amount | Net Amount
//
// LS = Listing Price
// Rate = LS / PCS
// Gross = Rate * PCS = LS
// ============================================================================

function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num)) return 'Zero'
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function inWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '')
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '')
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '')
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '')
  }

  const intPart = Math.floor(Math.abs(num))
  return inWords(intPart) || 'Zero'
}

function renderGstLineItems(
  sale: PrintableSale
): string {

  const MIN_ROWS = 14

  const saleAny = sale as any
  const saleGstPercent =
    saleAny.gstPercentage != null
      ? Number(saleAny.gstPercentage)
      : saleAny.taxPercentage != null
        ? Number(saleAny.taxPercentage)
        : 0

  const itemRows = sale.items
    .map((item, idx) => {

      const name =
        item.product?.name ??
        item.productName ??
        'Item'

      const hsn = item.hsn ?? ''

      const itemAny = item as any

      const rawLS =
        itemAny.listingPrice != null
          ? Number(itemAny.listingPrice)
          : itemAny.mrp != null
            ? Number(itemAny.mrp)
            : null

      const pcs = Number(item.pcs ?? item.quantity ?? 0)

      const rate =
        rawLS != null && pcs > 0
          ? rawLS / pcs
          : Number(item.saleRate ?? item.unitPrice ?? 0)

      const listingPrice = rawLS != null ? rawLS : rate * pcs
      const grossAmount = rate * pcs

      const schemePercent = Number(item.schemePercent ?? 0)
      const schemeAmount =
        schemePercent > 0
          ? (grossAmount * schemePercent) / 100
          : 0

      const taxableAmount = Math.max(0, grossAmount - schemeAmount)

      const gstPercent = Number(
        item.gstPercent ?? itemAny.taxPercent ?? saleGstPercent
      )
      const gstAmount = (taxableAmount * gstPercent) / 100
      const netAmount = taxableAmount + gstAmount

      return `
        <tr>
          <td class="col-sr">${idx + 1}</td>
          <td class="col-hsn">${hsn}</td>
          <td class="col-desc">${name}</td>
          <td class="col-ls">${listingPrice.toFixed(2)}</td>
          <td class="col-pcs">${pcs}</td>
          <td class="col-rate">${rate.toFixed(2)}</td>
          <td class="col-gross">${grossAmount.toFixed(2)}</td>
          <td class="col-scheme">${schemePercent > 0 ? schemePercent.toFixed(2) : ''}</td>
          <td class="col-taxable">${taxableAmount.toFixed(2)}</td>
          <td class="col-gstpct">${gstPercent > 0 ? gstPercent.toFixed(2) : '0.00'}</td>
          <td class="col-gstamt">${gstAmount.toFixed(2)}</td>
          <td class="col-net">${netAmount.toFixed(2)}</td>
        </tr>
      `
    })
    .join('')

  const emptyRowsCount = Math.max(0, MIN_ROWS - sale.items.length)
  const emptyRows = Array.from({ length: emptyRowsCount })
    .map(
      () => `
        <tr>
          <td class="col-sr">&nbsp;</td>
          <td class="col-hsn"></td>
          <td class="col-desc"></td>
          <td class="col-ls"></td>
          <td class="col-pcs"></td>
          <td class="col-rate"></td>
          <td class="col-gross"></td>
          <td class="col-scheme"></td>
          <td class="col-taxable"></td>
          <td class="col-gstpct"></td>
          <td class="col-gstamt"></td>
          <td class="col-net"></td>
        </tr>
      `
    )
    .join('')

  return itemRows + emptyRows
}


// ============================================================================
// GST TAX INVOICE
// ============================================================================

const FALLBACK_QR_BASE64 = "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAABQIAAAAAABQAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAABQAAAAAAAAABDzzzzzyhCxTzzzzyDigzzzzwADzyBRTzzzzzgAAIAAAAAABQAAAAAAAAABSzDDDDCgCQQQAABiQgyhjCygwxxiDxTjDDDBQAAIAAAAAABQAAAAAAAAABSgTDCQCgAAQCRwjwDAAABTjRggBCBQATDDRRQAAIAAAAAABQAAAAAAAAABShQABQCgDCABSABQAjjAgBTiCiggBQBQABRRQAAIAAAAAABQAAAAAAAAABShQABQCgDCBBQABQDBDCCxSgwCCBhQBQABRRQAAIAAAAAABQAAAAAAAAABSgAAAACgBAABQABSACAAhBAAiggBDQAAABBRQAAIAAAAAABQAAAAAAAAABTjDDDDChAQSzxCTBwBiCgiwjQCAijwBDDDCBQAAIAAAAAABQAAAAAAAAABBDDDDDBADATwBBCDxywCSDDzxAgDCBDTDDDCAAAIAAAAAABQAAAAAAAAAAQwADDDDDDAATDDDAjDDgiBCCAjDDDQBTBDDAAAAIAAAAAABQAAAAAAAAABSgBAASwAgARDwAAAwABAACgAyjyAAAAAABABQgAIAAAAAABQAAAAAAAAAABDDDDDCgBCAzAABwAACDDAiAgDhDDQBCDTAQQAAIAAAAAABQAAAAAAAAABSgAQRTyADATwBShDADghDiACADCDDCBQSwBBQAAIAAAAAABQAAAAAAAAABTjDBDTDAABADSBzADDDDAAyiAAADDDCBAAABQAAIAAAAAABQAAAAAAAAADARgCyCzDDQABRQjQQgAAADgwgAQgAjCTgARzAAAIAAAAAABQAAAAAAAAAABSgBQCzTDzQSwiBhATBzCjjCwwiADRAAQAQTyAAIAAAAAABQAAAAAAAAAARBCBBzCAzgBzCzTxiAACDTBDTAARxwBDwBQCCAAIAAAAAABQAAAAAAAAABAAARyxBTSwzgDwigAS1b0AAAwiBDCygjABCCAAAIAAAAAABQAAAAAAAAABCQhDDgjyQDRAzASgBgRL2tAxCSwxwwwwwxSRgAAIAAAAAABQAAAAAAAAAAAAQgBhzxhzzDRRyisOab+cASwAwwwgQQxhwgQAAIAAAAAABQAAAAAAAAAAAAwQRQAwDAAAACSAQ4Jo6hCiACQyBAwwzRQBQAAIAAAAAABQAAAAAAAAAARAQBRASQAQAAAAiBgpLgBDyAACggggghBBQRAAAIAAAAAABQAAAAAAAAABSgwwABwwDwQDwABQAwAAxSghQQABzwCwAxxwgAAIAAAAAABQAAAAAAAAABSAAgAQRACgAzQwxQiDjARggAyygTxgRgwhQCQAAIAAAAAABQAAAAAAAAAABCQABTQwDxjwBAwgCyAAiwwDgwCgBQCQABRRQAAIAAAAAABQAAAAAAAAABSgAAAACgzgwgAxQgCyQyQQQgSiQwxgwgjgBhwgAIAAAAAABQAAAAAAAAABSwAAAAAAAADwTAQwwAAwBQAQgAAAggxAwBRwAgAIAAAAAABQAAAAAAAAABSwAARggAAATzgABgAgAwhQAACAwgBQQwwgQBQAAIAAAAAABQAAAAAAAAABShQAADgQABTwAAABAAQAAgAQgAggBCgAABQQAAAIAAAAAABQAAAAAAAAABSRQBAACQQgDwTgQAgwwASAAiSigyQAAAAhBhAgAIAAAAAABQAAAAAAAAAAQAAAAAAQBgADQgAASgAADQACACjQgARwShRQAAAIAAAAAABQAAAAAAAAABSzzzzyigAAADxABwDTygAgTTyhyihBBwABQBQAAIAAAAAABQAAAAAAAAABSgAAAACgAAADgCADwAAAAAAAiiAAAgBAAxQAQAAIAAAAAABQAAAAAAAAABShQABQCgBjxxQDQhQTTyjzAARQAAAABDxgRSyAAIAAAAAABQAAAAAAAAABShQABQCgSQTRgDygBAgCiggigBCiQCxjzjRRQAAIAAAAAABQAAAAAAAAABSgTzygCgASTwRjyyggCgAAiigCCABAQABAABQAAIAAAAAABQAAAAAAAAABSwAAABSgTAThThQCDAigADCjwDACBSyBCgBBQAAIAAAAAABQAAAAAAAAABBDDDDDCADBDBBDAAADDDDABDCADDDDABCAADAAAIAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAABQAAAAAAAAAAAACjSigDwggQwABAwhADATTDwBwBAhwgQwAAAAAIAAAAAABQAAAAAAAAAAAAQjDShQADxwDSwwgCSygCTQQBwTzhxxgyAAAAAIAAAAAABQAAAAAAAAAAAAAAAAAAAAABCAAAAAAAAAAAAABBAAAAAAAAAAAIAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIAAAAAABQAAAAAAADIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAABQAAAAAAAADLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLKAAAAAAAAABQAAAAAAAAAAAAgQgQgQgQgQgQgQgQgQgQgQgQgQgQgQgQgAAAAAAAAAAABQAAAAAAAAAAIDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDIoAAAAAAAAABQAAAAAAAAABYBxQQgSCAQgxixyTBhiDCQAQzDDwyASQhSQCoAAAAAAAAABQAAAAAAAAABQDxTihTizxwCzzxiiDyhCgDxyhTRgRzQDiACoAAAAAAAAABQAAAAAAAAABIQSCCwQiyBRiATDCAQCByQSBTCSiCAjSiwAAoAAAAAAAAABQAAAAAAAAABL84444444444444444444444444444444454AAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAYAII4QoQgYIQQjCY4IIgDoiBAAYoYAAAAAAAAAAAAABQAAAAAAAAAAAAABJCRRCJCxISBrDRgRaKySJbRp7SCzaoAAAAAAAAAAAABQAAAAAAAAAAAAAABAACCAABACCoAAAAAAACIACBABAFIAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAA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"

export const generateGSTInvoiceHTML = (
  sale: PrintableSale,
  settings: PrintableSettings
) => {

  const symbol = settings.currencySymbol || '₹'
  const settingsAny = settings as any

  let grossTotal = 0
  let schemeTotal = 0
  let taxableTotal = 0
  let gstTotal = 0
  let netTotal = 0
  let totalQtyPcs = 0

  const saleAny = sale as any
  const saleGstPercent =
    saleAny.gstPercentage != null
      ? Number(saleAny.gstPercentage)
      : saleAny.taxPercentage != null
        ? Number(saleAny.taxPercentage)
        : 0

  sale.items.forEach((item) => {
    const itemAny = item as any
    const rawLS =
      itemAny.listingPrice != null
        ? Number(itemAny.listingPrice)
        : itemAny.mrp != null
          ? Number(itemAny.mrp)
          : null
    const pcs = Number(item.pcs ?? item.quantity ?? 0)
    const rate =
      rawLS != null && pcs > 0
        ? rawLS / pcs
        : Number(item.saleRate ?? item.unitPrice ?? 0)
    const gross = rate * pcs

    const schemePct = Number(item.schemePercent ?? 0)
    const schemeAmt = schemePct > 0 ? (gross * schemePct) / 100 : 0
    const taxable = Math.max(0, gross - schemeAmt)
    const gstPct = Number(item.gstPercent ?? itemAny.taxPercent ?? saleGstPercent)
    const gstAmt = (taxable * gstPct) / 100
    const net = taxable + gstAmt

    grossTotal += gross
    schemeTotal += schemeAmt
    taxableTotal += taxable
    gstTotal += gstAmt
    netTotal += net
    totalQtyPcs += pcs
  })

  const storedRoundOff = Number(sale.roundOff ?? 0)
  const roundOffValue =
    storedRoundOff !== 0
      ? storedRoundOff
      : Number((Math.round(netTotal) - netTotal).toFixed(2))

  const finalPayable =
    sale.grandTotal && sale.grandTotal > 0
      ? Number(sale.grandTotal)
      : Math.round(netTotal)

  const isInterstate = Boolean(
    sale.igstApplicable ||
    (sale.customerStateCode &&
      settings.stateCode &&
      sale.customerStateCode !== settings.stateCode)
  )

  const halfGst = gstTotal / 2
  const cgstVal = isInterstate ? 0 : halfGst
  const sgstVal = isInterstate ? 0 : halfGst
  const igstVal = isInterstate ? gstTotal : 0

  const amountInWordsStr = numberToWordsIndian(finalPayable)

  const invoiceDate = sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN')

  const dueDate = sale.dueDate
    ? new Date(sale.dueDate).toLocaleDateString('en-IN')
    : invoiceDate

  const customerState =
    (sale as any).customerState || ''

  const firstGstPercent =
    Number(sale.items[0]?.gstPercent ?? saleGstPercent)

  const qrSrc =
    settings.qrCodeDataUrl &&
      settings.qrCodeDataUrl.startsWith('data:')
      ? settings.qrCodeDataUrl
      : FALLBACK_QR_BASE64

  const bankName = settings.bankName || settingsAny.bankName
  const accountNumber = settings.bankAccountNumber || settingsAny.accountNumber || settingsAny.bankAccountNumber
  const ifscCode = settings.bankIfsc || settingsAny.ifscCode || settingsAny.bankIfsc
  const branchName = settings.bankBranch || settingsAny.branchName || settingsAny.bankBranch
  const upiId = settingsAny.upiId || settingsAny.upiID

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GST Invoice - ${sale.invoiceNumber}</title>

  <style>
    @page { size: 297mm 210mm; margin: 8mm 4mm; }

    @media print {
      @page { size: 297mm 210mm; margin: 8mm 4mm; }
      html, body { width: 289mm; height: 194mm; overflow: hidden; }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
      font-weight: 700 !important;
    }

    html, body {
      width: 289mm;
      height: 194mm;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9px;
      line-height: 1.25;
      font-weight: 700 !important;
    }

    .invoice-page {
      width: 289mm;
      height: 194mm;
      margin: 0 auto;
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .header-row {
      width: 100%;
      display: flex;
      border-bottom: 1px solid #000;
    }

    .header-col { padding: 4px 6px; }

    .header-col.seller {
      width: 38%;
      border-right: 1px solid #000;
    }

    .header-col.center {
      width: 24%;
      border-right: 1px solid #000;
      text-align: center;
    }

    .header-col.party { width: 38%; }

    .seller-name {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .seller-line { font-size: 8px; line-height: 1.3; margin-top: 1px; }

    .gst-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 2px;
      padding-bottom: 1px;
      border-bottom: 1px solid #000;
    }
    .center-content-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
      margin-top: 2px;
    }
    .center-left-info {
      flex: 1;
      text-align: left;
      font-size: 8px;
      font-weight: 700;
      line-height: 1.35;
    }
    .credit-memo-label {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .center-left-info .inv-meta-row {
      display: flex;
      justify-content: space-between;
      gap: 4px;
      font-weight: 700;
      margin-top: 1px;
    }
    .center-right-qr {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .center-right-qr .qr-code-image {
      width: 50px;
      height: 50px;
      display: block;
      border: 1px solid #000;
      object-fit: contain;
    }
    .center-right-qr .qr-code-label {
      font-size: 6px;
      margin-top: 1px;
      font-weight: 700;
      text-align: center;
    }

    .party-label {
      font-size: 9px;
      font-weight: 800;
      text-decoration: underline;
      margin-bottom: 2px;
    }
    .party-name { font-weight: 800; font-size: 10px; margin-bottom: 1px; }
    .party-line { font-size: 8px; font-weight: 700; line-height: 1.3; margin-top: 1px; }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #000;
    }

    .items-table th,
    .items-table td {
      padding: 2px 3px;
      font-size: 8px;
      line-height: 1.2;
      vertical-align: middle;
      overflow: hidden;
      word-wrap: break-word;
    }

    .items-table thead th {
      border: 1px solid #000;
      font-weight: 700;
      text-align: center;
      background: #ffffff;
      padding: 3px 2px;
    }

    .items-table tbody td {
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-top: none;
      border-bottom: none;
      height: 5mm;
    }

    .items-table tfoot td {
      border: 1px solid #000;
      font-weight: 700;
      background: #ffffff;
    }

    .col-sr      { width: 4%;  text-align: center; }
    .col-hsn     { width: 7%;  text-align: center; }
    .col-desc    { width: 22%; text-align: left;   }
    .col-ls      { width: 8%;  text-align: right;  }
    .col-pcs     { width: 5%;  text-align: center; }
    .col-rate    { width: 8%;  text-align: right;  }
    .col-gross   { width: 9%;  text-align: right;  }
    .col-scheme  { width: 5%;  text-align: center; }
    .col-taxable { width: 10%; text-align: right;  }
    .col-gstpct  { width: 4%;  text-align: center; }
    .col-gstamt  { width: 9%;  text-align: right;  }
    .col-net     { width: 9%;  text-align: right;  }

    .summary-row {
      width: 100%;
      display: flex;
      border-top: 1px solid #000;
    }

    .summary-col { padding: 4px 6px; }

    .summary-col.tax-breakdown {
      width: 44%;
      border-right: 1px solid #000;
    }

    .summary-col.bank-details {
      width: 26%;
      border-right: 1px solid #000;
    }

    .summary-col.amount-summary {
      width: 30%;
    }

    .tax-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 3px;
    }
    .tax-table th, .tax-table td {
      border: 1px solid #000;
      padding: 2px;
      font-size: 7px;
      text-align: right;
    }
    .tax-table th { font-weight: 700; text-align: center; }
    .tax-table td:first-child { text-align: center; }

    .bank-line { font-size: 7.5px; line-height: 1.4; margin-bottom: 1px; }

    .totals-line {
      display: flex;
      justify-content: space-between;
      gap: 4px;
      font-size: 7.5px;
      line-height: 1.35;
      min-height: 3.5mm;
    }
    .totals-line span:last-child { text-align: right; white-space: nowrap; }
    .net-payable {
      border-top: 1px solid #000;
      margin-top: 2px;
      padding-top: 2px;
      font-weight: 700;
      font-size: 9px;
    }

    .words-row {
      width: 100%;
      border-top: 1px solid #000;
      padding: 3px 6px;
      font-size: 8px;
      font-weight: 700;
    }

    .terms-row {
      width: 100%;
      border-top: 1px solid #000;
      padding: 4px 6px;
      font-size: 7px;
      line-height: 1.3;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }
    .terms-left {
      flex: 1;
    }
    .terms-title { font-weight: 700; margin-bottom: 1px; }

    .terms-right-signatures {
      display: flex;
      gap: 20px;
      align-items: flex-end;
      text-align: center;
      white-space: nowrap;
      padding-bottom: 2px;
    }
    .sig-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      min-width: 90px;
    }
    .sig-store-name {
      font-size: 7px;
      font-weight: 800;
      margin-bottom: 2px;
    }
    .sig-space {
      height: 20px;
    }
    .sig-title {
      font-size: 7.5px;
      font-weight: 800;
      border-top: 1px dashed #000;
      padding-top: 2px;
      width: 100%;
    }

    .invoice-page, .header-row, .items-table,
    .summary-row, .words-row, .terms-row {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  </style>

</head>

<body>

<div class="invoice-page">

  <div class="header-row">

    <div class="header-col seller">
      <div class="seller-name">${settings.storeName || 'MY STORE'}</div>
      ${settings.storeAddress ? `<div class="seller-line"><strong>${settings.storeAddress}${settings.storeCity ? ', ' + settings.storeCity : ''}</strong></div>` : ''}
      ${settings.storeMobile ? `<div class="seller-line"><strong>PH:</strong> ${settings.storeMobile}</div>` : ''}
      <div class="seller-line" style="margin-top: 4px;"><strong>GSTIN NO:</strong> ${settings.gstNumber || ''} &nbsp;&nbsp; <strong>PAN No:</strong> ${settings.panNumber || ''}</div>
      <div class="seller-line"><strong>State: ${settings.stateName || ''}${settings.stateCode ? ' (' + settings.stateCode + ')' : ''}</strong></div>
      ${settings.fssaiNumber ? `<div class="seller-line"><strong>FSSAI: ${settings.fssaiNumber}</strong></div>` : ''}
    </div>

    <div class="header-col center">
      <div class="gst-title">GST INVOICE</div>
      <div class="center-content-wrapper">
        <div class="center-left-info">
          <div class="credit-memo-label">CREDIT MEMO</div>
          <div class="inv-meta-row"><span>Invoice No:</span> <span>${sale.invoiceNumber}</span></div>
          <div class="inv-meta-row"><span>Date:</span> <span>${invoiceDate}</span></div>
          <div class="inv-meta-row"><span>Due Date:</span> <span>${dueDate}</span></div>
        </div>
        <div class="center-right-qr">
          <img src="${qrSrc}" alt="Payment QR Code" class="qr-code-image" />
          <div class="qr-code-label">Scan to Pay</div>
        </div>
      </div>
    </div>

    <div class="header-col party">
      <div class="party-label"><strong>CUSTOMER / PARTY</strong></div>
      <div class="party-name"><strong>${sale.customerName || 'Walk-in Customer'}</strong></div>
      ${sale.customerAddress ? `<div class="party-line"><strong>Address: ${sale.customerAddress}</strong></div>` : ''}
      ${sale.customerMobile ? `<div class="party-line"><strong>Phone: ${sale.customerMobile}</strong></div>` : ''}
      ${sale.customerGstNumber ? `<div class="party-line"><strong>GSTIN: ${sale.customerGstNumber}</strong></div>` : ''}
      ${customerState ? `<div class="party-line"><strong>State: ${customerState}</strong></div>` : ''}
      ${sale.customerFssai ? `<div class="party-line"><strong>FSSAI: ${sale.customerFssai}</strong></div>` : ''}
    </div>

  </div>


  <table class="items-table">
    <colgroup>
      <col class="col-sr">   <col class="col-hsn">  <col class="col-desc">
      <col class="col-ls">   <col class="col-pcs">  <col class="col-rate">
      <col class="col-gross"><col class="col-scheme"><col class="col-taxable">
      <col class="col-gstpct"><col class="col-gstamt"><col class="col-net">
    </colgroup>
    <thead>
      <tr>
        <th>Sr.</th>
        <th>HSN</th>
        <th>Product Description</th>
        <th>LS</th>
        <th>Pcs</th>
        <th>Rate</th>
        <th>Gross</th>
        <th>Sch%</th>
        <th>Taxable</th>
        <th>GST%</th>
        <th>GST Amt</th>
        <th>Net Amount</th>
      </tr>
    </thead>
    <tbody>
      ${renderGstLineItems(sale)}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align: right;">TOTAL:</td>
        <td class="col-pcs">${totalQtyPcs}</td>
        <td class="col-rate"></td>
        <td class="col-gross">${grossTotal.toFixed(2)}</td>
        <td class="col-scheme">${schemeTotal > 0 ? schemeTotal.toFixed(2) : ''}</td>
        <td class="col-taxable">${taxableTotal.toFixed(2)}</td>
        <td class="col-gstpct"></td>
        <td class="col-gstamt">${gstTotal.toFixed(2)}</td>
        <td class="col-net">${netTotal.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>


  <div class="summary-row">

    <div class="summary-col tax-breakdown">
      <div style="font-weight:700; font-size:8px; margin-bottom:2px;">GST Tax Details</div>
      <table class="tax-table">
        <thead>
          <tr>
            <th>HSN</th>
            <th>Taxable</th>
            <th>CGST %</th>
            <th>CGST Amt</th>
            <th>SGST %</th>
            <th>SGST Amt</th>
            <th>IGST %</th>
            <th>IGST Amt</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${sale.items[0]?.hsn || 'TOTAL'}</td>
            <td>${taxableTotal.toFixed(2)}</td>
            <td>${!isInterstate ? (firstGstPercent / 2).toFixed(1) + '%' : '-'}</td>
            <td>${!isInterstate ? cgstVal.toFixed(2) : '0.00'}</td>
            <td>${!isInterstate ? (firstGstPercent / 2).toFixed(1) + '%' : '-'}</td>
            <td>${!isInterstate ? sgstVal.toFixed(2) : '0.00'}</td>
            <td>${isInterstate ? firstGstPercent.toFixed(1) + '%' : '-'}</td>
            <td>${isInterstate ? igstVal.toFixed(2) : '0.00'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-col bank-details">
      <div style="font-weight:700; font-size:8px; margin-bottom:2px;">Bank Details</div>
      ${bankName ? `<div class="bank-line"><strong>Bank:</strong> ${bankName}</div>` : ''}
      ${accountNumber ? `<div class="bank-line"><strong>A/C No:</strong> ${accountNumber}</div>` : ''}
      ${ifscCode ? `<div class="bank-line"><strong>IFSC:</strong> ${ifscCode}</div>` : ''}
      ${branchName ? `<div class="bank-line"><strong>Branch:</strong> ${branchName}</div>` : ''}
      ${upiId ? `<div class="bank-line"><strong>UPI ID:</strong> ${upiId}</div>` : ''}
    </div>

    <div class="summary-col amount-summary">
      <div class="totals-line"><span>Gross Amount:</span><span>${symbol}${grossTotal.toFixed(2)}</span></div>
      ${schemeTotal > 0 ? `<div class="totals-line"><span>Scheme Discount:</span><span>-${symbol}${schemeTotal.toFixed(2)}</span></div>` : ''}
      <div class="totals-line"><span>Taxable Amount:</span><span>${symbol}${taxableTotal.toFixed(2)}</span></div>
      ${!isInterstate ? `
        <div class="totals-line"><span>CGST:</span><span>${symbol}${cgstVal.toFixed(2)}</span></div>
        <div class="totals-line"><span>SGST:</span><span>${symbol}${sgstVal.toFixed(2)}</span></div>
      ` : `
        <div class="totals-line"><span>IGST:</span><span>${symbol}${igstVal.toFixed(2)}</span></div>
      `}
      ${roundOffValue !== 0 ? `<div class="totals-line"><span>Round-off:</span><span>${roundOffValue > 0 ? '+' : ''}${roundOffValue.toFixed(2)}</span></div>` : ''}
      <div class="totals-line net-payable"><span>NET PAYABLE:</span><span>${symbol}${finalPayable.toFixed(2)}</span></div>
    </div>

  </div>


  <div class="words-row">
    Amount in Words: ${amountInWordsStr} Only
  </div>


  <div class="terms-row">
    <div class="terms-left">
      <div class="terms-title">Terms & Conditions:</div>
      <div>${settings.termsConditions || '1. Goods once sold will not be taken back. 2. Subject to local jurisdiction only.'}</div>
      ${settings.jurisdictionText ? `<div>${settings.jurisdictionText}</div>` : ''}
      <div style="margin-top: 3px;">Narration :</div>
    </div>

    <div class="terms-right-signatures">
      <div class="sig-block">
        <div class="sig-space"></div>
        <div class="sig-title">Receiver's Signatory</div>
      </div>
      <div class="sig-block">
        <div class="sig-store-name">For ${settings.storeName || 'MY STORE'}</div>
        <div class="sig-space"></div>
        <div class="sig-title">Authorised Signatory</div>
      </div>
    </div>
  </div>


</div>

</body>
</html>
`
}
