interface POLineItem {
  lineNumber: number;
  vendorSku: string | null;
  ourSku: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface POVendor {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

interface POData {
  poNumber: string;
  status: string;
  orderDate: Date;
  expectedDeliveryDate: Date | null;
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  paymentTerms: string | null;
  shippingMethod: string | null;
  notes: string | null;
  vendor: POVendor;
  lineItems: POLineItem[];
}

export function generatePOHtml(po: POData): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const vendorAddress = [
    po.vendor.address,
    [po.vendor.city, po.vendor.state, po.vendor.zip].filter(Boolean).join(', '),
    po.vendor.country,
  ]
    .filter(Boolean)
    .join('<br/>');

  const lineItemsHtml = po.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.lineNumber}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${item.vendorSku || '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${item.ourSku || '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Purchase Order ${po.poNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      font-size: 14px;
      line-height: 1.5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-name {
      font-size: 28px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: -0.5px;
    }
    .company-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .po-title {
      text-align: right;
    }
    .po-title h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .po-number {
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 4px;
    }
    .po-status {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      background: #dbeafe;
      color: #1d4ed8;
      margin-top: 6px;
    }
    .info-grid {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-bottom: 32px;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-section p {
      font-size: 13px;
      margin-bottom: 2px;
    }
    .info-section .name {
      font-weight: 600;
      font-size: 14px;
    }
    .dates-grid {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .date-item label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      display: block;
    }
    .date-item span {
      font-size: 14px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead th {
      background: #f3f4f6;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #374151;
      text-align: left;
      border-bottom: 2px solid #d1d5db;
    }
    thead th:first-child,
    thead th:nth-child(5) {
      text-align: center;
    }
    thead th:nth-child(6),
    thead th:last-child {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-table {
      width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #1a1a1a;
      margin-top: 4px;
      padding-top: 10px;
      font-weight: 700;
      font-size: 16px;
    }
    .footer-section {
      margin-bottom: 24px;
    }
    .footer-section h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .footer-section p {
      font-size: 13px;
      color: #374151;
    }
    .page-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="company-name">MyMully</div>
        <div class="company-subtitle">Procurement Hub</div>
      </div>
      <div class="po-title">
        <h1>Purchase Order</h1>
        <div class="po-number">${po.poNumber}</div>
        <div class="po-status">${po.status}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <h3>Vendor</h3>
        <p class="name">${po.vendor.name}</p>
        ${po.vendor.contactName ? `<p>${po.vendor.contactName}</p>` : ''}
        ${vendorAddress ? `<p>${vendorAddress}</p>` : ''}
        ${po.vendor.email ? `<p>${po.vendor.email}</p>` : ''}
        ${po.vendor.phone ? `<p>${po.vendor.phone}</p>` : ''}
      </div>
      <div class="info-section">
        <h3>Ship To</h3>
        <p class="name">MyMully</p>
        <p>Warehouse Receiving</p>
      </div>
    </div>

    <div class="dates-grid">
      <div class="date-item">
        <label>Order Date</label>
        <span>${formatDate(po.orderDate)}</span>
      </div>
      <div class="date-item">
        <label>Expected Delivery</label>
        <span>${formatDate(po.expectedDeliveryDate)}</span>
      </div>
      ${po.shippingMethod ? `<div class="date-item"><label>Shipping Method</label><span>${po.shippingMethod}</span></div>` : ''}
      ${po.paymentTerms ? `<div class="date-item"><label>Payment Terms</label><span>${po.paymentTerms}</span></div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Vendor SKU</th>
          <th>Our SKU</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(po.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Tax</span>
          <span>${formatCurrency(po.tax)}</span>
        </div>
        <div class="totals-row">
          <span>Shipping</span>
          <span>${formatCurrency(po.shipping)}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>${formatCurrency(po.totalAmount)}</span>
        </div>
      </div>
    </div>

    ${po.notes ? `<div class="footer-section"><h3>Notes</h3><p>${po.notes}</p></div>` : ''}

    <div class="page-footer">
      <p>This purchase order is subject to our standard terms and conditions.</p>
      <p>MyMully Procurement Hub &mdash; Generated on ${formatDate(new Date())}</p>
    </div>
  </div>
</body>
</html>`;
}
