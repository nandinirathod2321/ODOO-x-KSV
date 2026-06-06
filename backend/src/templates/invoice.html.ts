export const invoiceTemplate = (inv: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; padding: 40px; margin: 0; }
    h1 { font-size: 28px; margin-bottom: 20px; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f9f9f9; font-weight: bold; }
    .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .total-row { font-weight: bold; font-size: 16px; background-color: #f0f0f0; }
    .gst-row { font-weight: bold; color: #555; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <h1>INVOICE</h1>
  <div class="header-info">
    <div>
      <p><strong>Invoice #:</strong> ${inv.invoiceNumber}</p>
      <p><strong>Date:</strong> ${new Date(inv.issuedAt).toLocaleDateString()}</p>
    </div>
    <div class="text-right">
      <p><strong>Vendor:</strong> ${inv.vendor.name}</p>
      <p><strong>Email:</strong> ${inv.vendor.email}</p>
      <p><strong>GST:</strong> ${inv.vendor.gstNumber || 'N/A'}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${inv.po.approval.quotation.rfq.title}</td>
        <td>${inv.po.approval.quotation.rfq.quantity} ${inv.po.approval.quotation.rfq.unit}</td>
        <td>$${inv.po.approval.quotation.unitPrice}</td>
        <td>$${inv.subtotal}</td>
      </tr>
      <tr class="gst-row">
        <td colspan="3" class="text-right">GST (18%)</td>
        <td>$${inv.taxAmount}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" class="text-right">Grand Total</td>
        <td>$${inv.total}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;
