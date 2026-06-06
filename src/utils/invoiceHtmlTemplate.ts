import { formatIndianCurrency } from './formatCurrency.ts';

export const buildInvoiceHTML = (invoiceData: any, companyData: any) => {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .company-details { font-size: 14px; }
    .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #34495e; text-align: right; }
    .meta-table { width: 100%; margin-bottom: 30px; }
    .meta-table td { padding: 5px; font-size: 14px; }
    .bill-to { margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .bill-to h3 { margin-top: 0; color: #2c3e50; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
    .items-table th { background-color: #f4f6f7; color: #2c3e50; }
    .items-table .text-right { text-align: right; }
    .summary-table { width: 50%; float: right; border-collapse: collapse; margin-bottom: 40px; }
    .summary-table td { padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; }
    .summary-table .bold { font-weight: bold; font-size: 16px; color: #2c3e50; }
    .bank-details { clear: both; margin-top: 40px; font-size: 12px; color: #555; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
    .signatory { float: right; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-details">
      <div class="company-name">${companyData.name || 'VendorBridge Inc.'}</div>
      <div>${companyData.address || '123 Business Road, Tech Park'}</div>
      <div>GSTIN: ${companyData.gstin || '27AADCB2230M1Z2'}</div>
      <div>Phone: ${companyData.phone || '+91 9876543210'} | Email: ${companyData.email || 'billing@vendorbridge.com'}</div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td width="50%">
        <strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}<br>
        <strong>Purchase Order:</strong> ${invoiceData.purchaseOrder?.poNumber || 'N/A'}<br>
      </td>
      <td width="50%" style="text-align: right;">
        <strong>Invoice Date:</strong> ${new Date(invoiceData.invoiceDate).toLocaleDateString()}<br>
        <strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}<br>
      </td>
    </tr>
  </table>

  <div class="bill-to">
    <h3>Bill To:</h3>
    <strong>${invoiceData.vendor.name}</strong><br>
    ${invoiceData.vendor.address || 'N/A'}<br>
    GSTIN: ${invoiceData.vendor.gstNumber || 'N/A'}<br>
    Attn: ${invoiceData.vendor.contactPerson || 'N/A'}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th>Unit</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Tax %</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.items.map((item: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td>${item.unit}</td>
          <td class="text-right">${formatIndianCurrency(item.unitPrice)}</td>
          <td class="text-right">${item.taxPercent}%</td>
          <td class="text-right">${formatIndianCurrency(item.lineTotal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <table class="summary-table">
    <tr>
      <td>Subtotal:</td>
      <td class="bold">${formatIndianCurrency(invoiceData.subtotal)}</td>
    </tr>
    ${invoiceData.igstAmount > 0 ? `
    <tr>
      <td>IGST:</td>
      <td>${formatIndianCurrency(invoiceData.igstAmount)}</td>
    </tr>` : `
    <tr>
      <td>CGST:</td>
      <td>${formatIndianCurrency(invoiceData.cgstAmount)}</td>
    </tr>
    <tr>
      <td>SGST:</td>
      <td>${formatIndianCurrency(invoiceData.sgstAmount)}</td>
    </tr>`}
    <tr>
      <td class="bold">Grand Total:</td>
      <td class="bold">${formatIndianCurrency(invoiceData.grandTotal)}</td>
    </tr>
  </table>

  <div class="bank-details">
    <h3>Bank Details</h3>
    Bank Name: ${companyData.bankName || 'HDFC Bank'}<br>
    Account Number: ${companyData.accountNumber || '0000123456789'}<br>
    IFSC: ${companyData.ifsc || 'HDFC0001234'}
  </div>

  <div class="signatory">
    <br><br>
    _______________________<br>
    Authorized Signatory
  </div>

  <div class="footer">
    This is a computer generated invoice and does not require a physical signature.
  </div>
</body>
</html>`;
};

export const buildPurchaseOrderHTML = (poData: any, companyData: any) => {
  return `<!DOCTYPE html><html><body><h2>Purchase Order ${poData.poNumber}</h2></body></html>`;
};
