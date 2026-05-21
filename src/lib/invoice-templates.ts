// src/lib/invoice-templates.ts

export const generateThermalReceiptHTML = (sale: any, settings: any) => {
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
        .font-bold { font-weight: bold; }
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
        <div><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>
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
          ${sale.items.map((item: any) => `
            <tr>
              <td class="item-name">${item.product?.name || 'Item'}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">${Number(item.saleRate).toFixed(2)}</td>
              <td class="text-right">${(Number(item.saleRate) * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="border-bottom text-right">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${settings.currencySymbol} ${(Number(sale.grandTotal) + Number(sale.discountAmount) - Number(sale.labourCost)).toFixed(2)}</span>
        </div>
        ${Number(sale.discountAmount) > 0 ? `
          <div class="totals-row">
            <span>Discount:</span>
            <span>- ${settings.currencySymbol} ${Number(sale.discountAmount).toFixed(2)}</span>
          </div>
        ` : ''}
        ${Number(sale.labourCost) > 0 ? `
          <div class="totals-row">
            <span>Labour/Other:</span>
            <span>+ ${settings.currencySymbol} ${Number(sale.labourCost).toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="totals-row grand-total">
          <span>Net Final:</span>
          <span>${settings.currencySymbol} ${Number(sale.grandTotal).toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        ${settings.termsConditions ? `<div style="margin-bottom: 5px;">${settings.termsConditions.replace(/\n/g, '<br/>')}</div>` : ''}
        <div>Thank you for your business!</div>
        <div>Software by Neural Slate</div>
      </div>
    </body>
    </html>
  `
}

export const generateA4InvoiceHTML = (sale: any, settings: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tax Invoice - ${sale.invoiceNumber}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; margin: 0; padding: 20mm; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 30px; }
        .store-details h1 { color: #ea580c; margin: 0 0 5px 0; font-size: 28px; text-transform: uppercase; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { margin: 0 0 10px 0; color: #666; font-size: 24px; text-transform: uppercase; }
        .bill-to { margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 6px; }
        .bill-to h3 { margin: 0 0 10px 0; color: #ea580c; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #ea580c; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary-box { width: 300px; float: right; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .grand-total { font-size: 18px; font-weight: bold; color: #ea580c; border-bottom: none; border-top: 2px solid #ea580c; padding-top: 12px; margin-top: 4px; }
        .footer { clear: both; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
        .terms { margin-top: 40px; clear: both; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-details">
          <h1>${settings.storeName || 'MY STORE'}</h1>
          ${settings.storeAddress ? `<div>${settings.storeAddress}</div>` : ''}
          ${settings.storeCity ? `<div>${settings.storeCity}</div>` : ''}
          ${settings.storeMobile ? `<div>Mobile: ${settings.storeMobile}</div>` : ''}
          ${settings.storeEmail ? `<div>Email: ${settings.storeEmail}</div>` : ''}
          ${settings.gstNumber ? `<div style="margin-top: 5px; font-weight: bold;">GSTIN: ${settings.gstNumber}</div>` : ''}
        </div>
        <div class="invoice-details">
          <h2>TAX INVOICE</h2>
          <div><strong>Invoice #:</strong> ${sale.invoiceNumber}</div>
          <div><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}</div>
          <div><strong>Time:</strong> ${new Date(sale.createdAt).toLocaleTimeString()}</div>
        </div>
      </div>

      <div class="bill-to">
        <h3>BILL TO</h3>
        <div style="font-size: 16px; font-weight: bold;">${sale.customerName || 'Walk-in Customer'}</div>
        ${sale.customerMobile ? `<div>Mobile: ${sale.customerMobile}</div>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 45%">Description</th>
            <th class="text-right" style="width: 15%">Rate</th>
            <th class="text-center" style="width: 15%">Quantity</th>
            <th class="text-right" style="width: 20%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map((item: any, idx: number) => `
            <tr>
              <td>${idx + 1}</td>
              <td>
                <div style="font-weight: bold;">${item.product?.name || 'Item'}</div>
                ${item.product?.sku ? `<div style="font-size: 12px; color: #666;">SKU: ${item.product.sku}</div>` : ''}
              </td>
              <td class="text-right">${settings.currencySymbol} ${Number(item.saleRate).toFixed(2)}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">${settings.currencySymbol} ${(Number(item.saleRate) * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${settings.currencySymbol} ${(Number(sale.grandTotal) + Number(sale.discountAmount) - Number(sale.labourCost)).toFixed(2)}</span>
        </div>
        ${Number(sale.discountAmount) > 0 ? `
          <div class="summary-row" style="color: #ef4444;">
            <span>Discount</span>
            <span>- ${settings.currencySymbol} ${Number(sale.discountAmount).toFixed(2)}</span>
          </div>
        ` : ''}
        ${Number(sale.labourCost) > 0 ? `
          <div class="summary-row">
            <span>Labour / Other</span>
            <span>+ ${settings.currencySymbol} ${Number(sale.labourCost).toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="summary-row grand-total">
          <span>Grand Total</span>
          <span>${settings.currencySymbol} ${Number(sale.grandTotal).toFixed(2)}</span>
        </div>
      </div>

      ${settings.termsConditions ? `
        <div class="terms">
          <div style="font-weight: bold; margin-bottom: 5px;">Terms & Conditions:</div>
          <div>${settings.termsConditions.replace(/\n/g, '<br/>')}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div>This is a computer generated invoice and does not require a physical signature.</div>
      </div>
    </body>
    </html>
  `
}
