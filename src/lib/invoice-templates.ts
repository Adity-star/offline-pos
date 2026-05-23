import type { PrintableSale, PrintableSettings } from '@/lib/print-invoice'

function formatMoney(value: number, symbol: string): string {
  return `${symbol}${value.toFixed(2)}`
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

  if (sale.discountType === 'PERCENTAGE' && sale.discountValue != null) {
    return ` / ${Number(sale.discountValue).toFixed(2)}%`
  }
  if (subtotal > 0) {
    return ` / ${((discountAmount / subtotal) * 100).toFixed(2)}%`
  }
  return ''
}

function renderA4LineItems(sale: PrintableSale, symbol: string): string {
  return sale.items
    .map((item, idx) => {
      const name = item.product?.name ?? item.productName ?? 'Item'
      const rate = Number(item.saleRate ?? item.unitPrice ?? 0)
      const qty = item.quantity
      const total = Number(item.totalPrice ?? rate * qty)

      return `
        <tr>
          <td class="col-index">${idx + 1}</td>
          <td class="col-desc">${name}</td>
          <td class="col-qty">${qty}</td>
          <td class="col-rate">${formatMoney(rate, symbol)}</td>
          <td class="col-amount">${formatMoney(total, symbol)}</td>
        </tr>
      `
    })
    .join('')
}

function renderThermalLineItems(sale: PrintableSale): string {
  return sale.items
    .map((item) => {
      const name = item.product?.name ?? item.productName ?? 'Item'
      const rate = Number(item.saleRate ?? item.unitPrice ?? 0)
      const lineTotal = Number(item.totalPrice ?? rate * item.quantity)

      return `
        <tr>
          <td class="item-name">${name}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${rate.toFixed(2)}</td>
          <td class="text-right">${lineTotal.toFixed(2)}</td>
        </tr>
      `
    })
    .join('')
}

export const generateThermalReceiptHTML = (sale: PrintableSale, settings: PrintableSettings) => {
  const symbol = settings.currencySymbol || '₹'
  const subtotal =
    Number(sale.subtotal) ||
    sale.items.reduce((s, i) => s + Number(i.totalPrice ?? i.saleRate * i.quantity), 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${sale.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          width: 80mm;
          margin: 0;
          padding: 5mm;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .border-bottom { border-bottom: 1px dashed #000; margin-bottom: 5px; padding-bottom: 5px; }
        .store-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 4px 0; text-align: left; }
        th { border-bottom: 1px solid #000; }
        .item-name { max-width: 40mm; word-wrap: break-word; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .grand-total { font-size: 16px; font-weight: bold; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000; }
        .footer { font-size: 10px; margin-top: 15px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="text-center border-bottom">
        <div class="store-name">${settings.storeName || 'MY STORE'}</div>
        ${settings.storeAddress ? `<div>${settings.storeAddress}</div>` : ''}
        ${settings.storeCity ? `<div>${settings.storeCity}</div>` : ''}
        ${settings.storeMobile ? `<div>Ph: ${settings.storeMobile}</div>` : ''}
        ${settings.gstNumber ? `<div>GSTIN: ${settings.gstNumber}</div>` : ''}
      </div>

      <div class="border-bottom">
        <div><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString('en-IN')}</div>
        <div><strong>Bill No:</strong> ${sale.invoiceNumber}</div>
        <div><strong>Customer:</strong> ${sale.customerName || 'Walk-in'}</div>
        ${sale.customerMobile ? `<div><strong>Mobile:</strong> ${sale.customerMobile}</div>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${renderThermalLineItems(sale)}
        </tbody>
      </table>

      <div class="border-bottom text-right">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatMoney(subtotal, symbol)}</span>
        </div>
        ${
          Number(sale.discountAmount) > 0
            ? `
          <div class="totals-row">
            <span>Discount:</span>
            <span>- ${formatMoney(Number(sale.discountAmount), symbol)}${formatDiscountPercent(sale)}</span>
          </div>
        `
            : ''
        }
        ${
          Number(sale.labourCost) > 0
            ? `
          <div class="totals-row">
            <span>Labour Cost:</span>
            <span>+ ${formatMoney(Number(sale.labourCost), symbol)}</span>
          </div>
        `
            : ''
        }
        ${
          Number(sale.taxAmount) > 0
            ? `
          <div class="totals-row">
            <span>Tax:</span>
            <span>+ ${formatMoney(Number(sale.taxAmount), symbol)}</span>
          </div>
        `
            : ''
        }
        <div class="totals-row grand-total">
          <span>Grand Total:</span>
          <span>${formatMoney(Number(sale.grandTotal), symbol)}</span>
        </div>
      </div>

      <div class="footer">
        ${settings.termsConditions ? `<div style="margin-bottom: 5px;">${settings.termsConditions.replace(/\n/g, '<br/>')}</div>` : ''}
        <div>Thank you for your business!</div>
      </div>
    </body>
    </html>
  `
}

export const generateA4InvoiceHTML = (
  sale: PrintableSale,
  settings: PrintableSettings
) => {
  const symbol = settings.currencySymbol || '₹'
  const subtotal =
    Number(sale.subtotal) ||
    sale.items.reduce(
      (s, i) => s + Number(i.totalPrice ?? i.saleRate * i.quantity),
      0
    )
  const invoiceDate = formatInvoiceDate(sale.createdAt)
  const invoiceTime = formatInvoiceTime(sale.createdAt)
  const discountPercent = formatDiscountPercent(sale)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Estimate - ${sale.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      background: #fff;
    }

    .invoice-page {
      width: 100%;
      min-height: 277mm;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .invoice-main {
      flex: 1 1 auto;
    }

    /* ── Header ── */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
    }

    .header-left .doc-title {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 0.5px;
      line-height: 1;
      margin: 0 0 6px 0;
    }

    .header-left .doc-number {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .header-left .doc-page {
      font-size: 13px;
      margin-top: 4px;
      color: #222;
    }

    .header-right {
      text-align: right;
      padding-top: 4px;
    }

    .header-right .store-name {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 4px 0;
    }

    .header-right .store-mobile {
      font-size: 14px;
    }

    .header-right .store-extra {
      font-size: 13px;
      margin-top: 2px;
    }

    /* ── Meta (Bill To + Details) ── */
    .meta-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin: 22px 0 20px;
    }

    .meta-block {
      flex: 1;
      max-width: 48%;
    }

    .meta-block.right {
      max-width: 42%;
      margin-left: auto;
    }

    .meta-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .bill-box {
      border: 1.5px solid #000;
      border-radius: 10px;
      padding: 14px 16px;
      min-height: 72px;
    }

    .bill-box .customer-name {
      font-size: 17px;
      font-weight: 700;
      margin: 0 0 6px 0;
    }

    .bill-box .customer-mobile {
      font-size: 13px;
    }

    .details-grid {
      width: 100%;
      border-collapse: collapse;
    }

    .details-grid td {
      padding: 5px 0;
      font-size: 14px;
      vertical-align: top;
    }

    .details-grid td.label {
      font-weight: 700;
      width: 72px;
      white-space: nowrap;
    }

    .details-grid td.value {
      text-align: right;
      font-weight: 400;
    }

    /* ── Items table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .items-table thead th {
      background: #e8e8e8;
      border: 1px solid #000;
      padding: 10px 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .items-table tbody td {
      border: 1px solid #000;
      padding: 10px 8px;
      font-size: 13px;
      vertical-align: middle;
      word-wrap: break-word;
    }

    .col-index { width: 5%; text-align: center; }
    .col-desc  { width: 47%; text-align: left; }
    .col-qty   { width: 10%; text-align: center; }
    .col-rate  { width: 18%; text-align: right; }
    .col-amount { width: 20%; text-align: right; }

    /* ── Totals ── */
    .totals-wrap {
      margin-top: 28px;
      border-top: 2px solid #000;
      padding-top: 16px;
    }

    .totals-section {
      width: 340px;
      margin-left: auto;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 5px 0;
      font-size: 14px;
    }

    .totals-row .label {
      font-weight: 400;
    }

    .totals-row .value {
      text-align: right;
      white-space: nowrap;
    }

    .totals-row.grand-total {
      font-size: 20px;
      font-weight: 700;
      padding-top: 10px;
      margin-top: 4px;
    }

    .totals-row.grand-total .label,
    .totals-row.grand-total .value {
      font-weight: 700;
    }

    /* ── Footer ── */
    .invoice-footer {
      margin-top: auto;
      padding-top: 48px;
    }

    .terms {
      font-size: 12px;
      line-height: 1.6;
    }

    .terms strong {
      font-size: 13px;
    }

    .terms-body {
      margin-top: 6px;
      white-space: pre-wrap;
    }

    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
      }

      .invoice-page {
        min-height: 277mm;
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="invoice-main">

      <header class="top-header">
        <div class="header-left">
          <div class="doc-title">ESTIMATE</div>
          <div class="doc-number">#${sale.invoiceNumber}</div>
          <div class="doc-page">Page 1 of 1</div>
        </div>
        <div class="header-right">
          <div class="store-name">${settings.storeName || 'STORE'}</div>
          ${
            settings.storeMobile
              ? `<div class="store-mobile">Mobile: ${settings.storeMobile}</div>`
              : ''
          }
          ${
            settings.storeAddress
              ? `<div class="store-extra">${settings.storeAddress}</div>`
              : ''
          }
          ${
            settings.storeCity
              ? `<div class="store-extra">${settings.storeCity}</div>`
              : ''
          }
          ${
            settings.gstNumber
              ? `<div class="store-extra">GSTIN: ${settings.gstNumber}</div>`
              : ''
          }
        </div>
      </header>

      <section class="meta-section">
        <div class="meta-block">
          <div class="meta-label">Bill To</div>
          <div class="bill-box">
            <div class="customer-name">${sale.customerName || 'Walk-in Customer'}</div>
            ${
              sale.customerMobile
                ? `<div class="customer-mobile">Mobile ${sale.customerMobile}</div>`
                : ''
            }
          </div>
        </div>

        <div class="meta-block right">
          <div class="meta-label">Estimate Details</div>
          <table class="details-grid">
            <tr>
              <td class="label">Date:</td>
              <td class="value">${invoiceDate}</td>
            </tr>
            <tr>
              <td class="label">Time:</td>
              <td class="value">${invoiceTime}</td>
            </tr>
          </table>
        </div>
      </section>

      <table class="items-table">
        <thead>
          <tr>
            <th class="col-index">#</th>
            <th class="col-desc">Item Description</th>
            <th class="col-qty">Qty</th>
            <th class="col-rate">Rate</th>
            <th class="col-amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${renderA4LineItems(sale, symbol)}
        </tbody>
      </table>

      <div class="totals-wrap">
        <div class="totals-section">
          <div class="totals-row">
            <span class="label">Sub Total</span>
            <span class="value">${formatMoney(subtotal, symbol)}</span>
          </div>
          ${
            Number(sale.discountAmount) > 0
              ? `
          <div class="totals-row">
            <span class="label">Discount</span>
            <span class="value">- ${formatMoney(Number(sale.discountAmount), symbol)}${discountPercent}</span>
          </div>
          `
              : ''
          }
          ${
            Number(sale.labourCost) > 0
              ? `
          <div class="totals-row">
            <span class="label">Labour Cost</span>
            <span class="value">+ ${formatMoney(Number(sale.labourCost), symbol)}</span>
          </div>
          `
              : ''
          }
          ${
            Number(sale.taxAmount) > 0
              ? `
          <div class="totals-row">
            <span class="label">Tax</span>
            <span class="value">+ ${formatMoney(Number(sale.taxAmount), symbol)}</span>
          </div>
          `
              : ''
          }
          <div class="totals-row grand-total">
            <span class="label">Grand Total</span>
            <span class="value">${formatMoney(Number(sale.grandTotal), symbol)}</span>
          </div>
        </div>
      </div>

    </div>

    <footer class="invoice-footer">
      <div class="terms">
        <strong>Terms &amp; Conditions:</strong>
        <div class="terms-body">${
          settings.termsConditions
            ? settings.termsConditions.replace(/\n/g, '<br/>')
            : '&nbsp;'
        }</div>
      </div>
    </footer>
  </div>
</body>
</html>`
}
