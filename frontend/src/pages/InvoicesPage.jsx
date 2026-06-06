import { useEffect, useState } from 'react';
import { getInvoices, markPaid, sendInvoiceEmail } from '../services/invoice.service.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoicesPage() {
  const role = useAuthStore(state => state.role);
  const [invoicesList, setInvoicesList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoicesList(data);
      if (data.length > 0) {
        setSelectedInvoice(data[0]);
      }
    } catch (err) {
      console.error(err);
      const fallback = [
        {
          id: 'inv-0082',
          invoiceNumber: 'INV-0082',
          purchaseOrder: { poNumber: 'PO-2129-2026' },
          vendor: { name: 'InfraSupplies Pvt Ltd', email: 'infra@supplies.com', gstNumber: '29AABCI1234J1Z5', address: '456 Industrial Area, Peenya, Bengaluru 560058' },
          invoiceDate: '2026-06-06T00:00:00Z',
          dueDate: '2026-07-06T00:00:00Z',
          grandTotal: 379071,
          status: 'PENDING',
          items: [
            { id: 1, description: 'Ergonomic Chair (High-Back)', quantity: 20, unit: 'Nos', unitPrice: 7200, taxPercent: 18, lineTotal: 170208 },
            { id: 2, description: 'Height-Adj. Workstation', quantity: 10, unit: 'Nos', unitPrice: 11500, taxPercent: 18, lineTotal: 135700 },
            { id: 3, description: 'Meeting Table (8-seater)', quantity: 3, unit: 'Nos', unitPrice: 20667, taxPercent: 18, lineTotal: 73163 }
          ]
        },
        {
          id: 'inv-0081',
          invoiceNumber: 'INV-0081',
          purchaseOrder: { poNumber: 'PO-2128-2026' },
          vendor: { name: 'TechCorp Ltd', email: 'vendor@techcorp.in' },
          invoiceDate: '2026-05-15T00:00:00Z',
          dueDate: '2026-06-14T00:00:00Z',
          grandTotal: 146910,
          status: 'OVERDUE',
          items: []
        },
        {
          id: 'inv-0080',
          invoiceNumber: 'INV-0080',
          purchaseOrder: { poNumber: 'PO-2127-2026' },
          vendor: { name: 'FurniMax Solutions', email: 'info@furnimax.com' },
          invoiceDate: '2026-04-10T00:00:00Z',
          dueDate: '2026-05-10T00:00:00Z',
          grandTotal: 103840,
          status: 'PAID',
          items: []
        }
      ];
      setInvoicesList(fallback);
      setSelectedInvoice(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return;
    try {
      if (selectedInvoice.id.startsWith('inv-')) {
        toast.success(`Invoice ${selectedInvoice.invoiceNumber} marked as PAID`);
        setInvoicesList(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'PAID' } : inv));
        setSelectedInvoice(prev => ({ ...prev, status: 'PAID' }));
        return;
      }
      await markPaid(selectedInvoice.id);
      toast.success(`Invoice ${selectedInvoice.invoiceNumber} marked as PAID`);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedInvoice) return;
    const element = document.querySelector('.inv-wrap');
    if (!element) {
      toast.error('Invoice wrapper not found');
      return;
    }
    const toastId = toast.loading('Generating professional PDF receipt...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice-${selectedInvoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF receipt', { id: toastId });
    }
  };

  const triggerEmailDirectly = (invoice, mode = 'SEND') => {
    let to = '';
    let cc = '';
    let subject = '';
    let body = '';

    const formattedTotal = invoice.grandTotal?.toLocaleString('en-IN');
    const formattedInvoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-GB') : 'N/A';
    const formattedDueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A';
    const poRef = invoice.purchaseOrder?.poNumber || 'N/A';
    const vendorName = invoice.vendor?.name || 'Partner';

    if (role === 'VENDOR') {
      to = 'officer@vendorbridge.com';
      cc = invoice.vendor?.email || '';
      subject = `[Invoice Submitted] Invoice ${invoice.invoiceNumber} - ${vendorName}`;
      body = `Dear Procurement Team,

Please find our Invoice ${invoice.invoiceNumber} submitted for Purchase Order ${poRef}.

- Invoice Number: ${invoice.invoiceNumber}
- PO Reference: ${poRef}
- Grand Total: ₹${formattedTotal}
- Invoice Date: ${formattedInvoiceDate}
- Due Date: ${formattedDueDate}

We request you to process the payment as per the terms.

Best regards,
${vendorName}`;
    } else {
      to = invoice.vendor?.email || 'vendor@example.com';
      cc = 'officer@vendorbridge.com';
      if (mode === 'SEND') {
        subject = `[Invoice Issued] ${invoice.invoiceNumber} - Acme Corp India`;
        body = `Dear ${vendorName},

Please find details for Invoice ${invoice.invoiceNumber} associated with Purchase Order ${poRef}.

- Invoice Number: ${invoice.invoiceNumber}
- PO Number: ${poRef}
- Grand Total: ₹${formattedTotal}
- Invoice Date: ${formattedInvoiceDate}
- Due Date: ${formattedDueDate}

Payment details are enclosed in the attached PDF. Please process payment at your earliest convenience.

Best regards,
Procurement Team, Acme Corp India`;
      } else {
        subject = `[URGENT REMINDER] Overdue Invoice ${invoice.invoiceNumber} - Acme Corp India`;
        body = `Dear ${vendorName},

This is a friendly reminder that Invoice ${invoice.invoiceNumber} for ₹${formattedTotal} is currently overdue.

- Invoice Number: ${invoice.invoiceNumber}
- PO Number: ${poRef}
- Due Date: ${formattedDueDate}
- Current Status: OVERDUE

Please process payment at your earliest convenience to avoid any service disruption. If the payment has already been sent, please share the receipt.

Best regards,
Procurement Team, Acme Corp India`;
      }
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');

    try {
      if (!invoice.id.startsWith('inv-')) {
        const emailPayload = {
          toEmail: to,
          ccEmail: cc,
          subject: subject,
          body: body.replace(/\n/g, '<br/>')
        };
        sendInvoiceEmail(invoice.id, emailPayload).then(() => {
          fetchInvoices();
        }).catch(console.error);
      }
      toast.success(`Gmail composer opened directly for ${invoice.invoiceNumber}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const numberToWords = (num) => {
    if (!num) return '';
    if (num === 0) return 'Zero';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertHundreds = (n) => {
      let str = '';
      if (n >= 100) {
        str += a[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += b[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += a[n] + ' ';
      }
      return str.trim();
    };

    let n = Math.floor(num);
    let parts = [];
    
    let hundreds = n % 1000;
    if (hundreds > 0) {
      parts.push(convertHundreds(hundreds));
    }
    n = Math.floor(n / 1000);
    
    if (n > 0) {
      let thousands = n % 100;
      if (thousands > 0) {
        parts.push(convertHundreds(thousands) + ' Thousand');
      }
      n = Math.floor(n / 100);
    }
    
    if (n > 0) {
      let lakhs = n % 100;
      if (lakhs > 0) {
        parts.push(convertHundreds(lakhs) + ' Lakh');
      }
      n = Math.floor(n / 100);
    }

    if (n > 0) {
      parts.push(convertHundreds(n) + ' Crore');
    }
    
    return parts.reverse().join(' ').trim() + ' Rupees only';
  };

  const calculateTaxes = (invoice) => {
    if (!invoice) return { subtotal: 0, cgst: 0, sgst: 0, igst: 0 };
    const subtotal = invoice.subtotal || Math.round((invoice.grandTotal || 0) / 1.18);
    const taxVal = (invoice.igstAmount || invoice.cgstAmount || 0) 
      ? ((invoice.igstAmount || 0) + (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0)) 
      : ((invoice.grandTotal || 0) - subtotal);
    const cgst = invoice.cgstAmount || (invoice.igstAmount ? 0 : Math.round(taxVal / 2));
    const sgst = invoice.sgstAmount || (invoice.igstAmount ? 0 : Math.round(taxVal / 2));
    const igst = invoice.igstAmount || (invoice.igstAmount ? taxVal : 0);
    return { subtotal, cgst, sgst, igst };
  };

  const taxInfo = selectedInvoice ? calculateTaxes(selectedInvoice) : null;

  const badgeHtml = (status) => {
    const map = {
      PAID: 'green',
      Paid: 'green',
      PENDING: 'amber',
      Pending: 'amber',
      OVERDUE: 'red',
      Overdue: 'red'
    };
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
  };

  const filteredInvoices = invoicesList.filter(inv => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return inv.status === 'PENDING' || inv.status === 'Pending';
    if (filter === 'Overdue') return inv.status === 'OVERDUE' || inv.status === 'Overdue';
    if (filter === 'Paid') return inv.status === 'PAID' || inv.status === 'Paid';
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div className="chip-row">
          {['All', 'Pending', 'Overdue', 'Paid'].map(f => (
            <div
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>
        
        {role !== 'VENDOR' && (
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => toast.success('New invoice template created')}>
            <i className="ti ti-plus"></i> New Invoice
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : (
        <div className="split">
          <div>
            {selectedInvoice && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{selectedInvoice.invoiceNumber} — Purchase Invoice</div>
                    <div className="card-sub">PO Ref: {selectedInvoice.purchaseOrder?.poNumber}</div>
                  </div>
                  <div className="card-actions">
                    {badgeHtml(selectedInvoice.status)}
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                      <i className="ti ti-printer"></i> Print
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleDownloadPdf}>
                      <i className="ti ti-download"></i> PDF
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => triggerEmailDirectly(selectedInvoice, 'SEND')}>
                      <i className="ti ti-mail"></i> Email
                    </button>
                  </div>
                </div>

                <div className="inv-wrap" style={{ border: 'none', borderRadius: 0, padding: '24px', background: '#fff', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--primary, #15803d)' }}></div>
                  
                  <div className="inv-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #15803d', paddingBottom: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#15803d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>V</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803d', letterSpacing: '-0.5px' }}>VendorBridge</div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#444', marginTop: '6px', textAlign: 'left' }}>Acme Corp India Pvt Ltd</div>
                      <div style={{ fontSize: '11px', color: '#666', textAlign: 'left' }}>123 Business Park, Whitefield, Bengaluru 560066</div>
                      <div style={{ fontSize: '11px', color: '#666', textAlign: 'left' }}>GST: 29AABCA1234J1Z5 · Tel: +91 80 4567 8900</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '1px' }}>TAX INVOICE RECEIPT</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#111', letterSpacing: '-1px', margin: '2px 0' }}>{selectedInvoice.invoiceNumber}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>Invoice Date: <strong>{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-GB')}</strong></div>
                      <div style={{ fontSize: '11px', color: '#555' }}>Due Date: <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}</strong></div>
                      <div style={{ marginTop: '8px', background: selectedInvoice.status === 'PAID' ? '#dcfce7' : '#fef9c3', color: selectedInvoice.status === 'PAID' ? '#15803d' : '#854d0e', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-block', border: selectedInvoice.status === 'PAID' ? '1px solid #86efac' : '1px solid #fde68a' }}>
                        {selectedInvoice.status === 'PAID' ? 'PAYMENT STATUS: RECEIVED' : 'PAYMENT STATUS: PENDING'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Billed Vendor</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.vendor?.name}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                        {selectedInvoice.vendor?.address || 'India'}<br />GSTIN: <strong>{selectedInvoice.vendor?.gstNumber || 'N/A'}</strong>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reference Details</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>PO Ref: {selectedInvoice.purchaseOrder?.poNumber}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                        ERP System Integration Reference<br />
                        Status: Generated & Reconciled
                      </div>
                    </div>
                  </div>

                  <table style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f0fdf4', color: '#166534' }}>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '40px' }}>#</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'left' }}>Item Description</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '80px' }}>Qty</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '110px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '70px', textAlign: 'center' }}>GST</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '120px', textAlign: 'right' }}>Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'left', fontWeight: 500 }}>{item.description}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'center' }}>{item.quantity} {item.unit || 'Nos'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'right' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'center' }}>{item.taxPercent}%</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'right', fontWeight: 600 }}>₹{item.lineTotal?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                        <tr>
                          <td colSpan="6" style={{ border: '1px solid #e2e8f0', padding: '16px', color: 'var(--text3)', textAlign: 'center' }}>No line items in detail</td>
                        </tr>
                      )}
                      
                      {taxInfo && (
                        <>
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan="5" style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontWeight: 600, textAlign: 'right', fontSize: '11px', color: '#475569' }}>Subtotal (Excl. Taxes)</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>₹{taxInfo.subtotal?.toLocaleString('en-IN')}</td>
                          </tr>
                          {taxInfo.cgst > 0 && (
                            <tr style={{ background: '#f8fafc' }}>
                              <td colSpan="5" style={{ border: '1px solid #e2e8f0', padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#475569' }}>CGST (9%)</td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>₹{taxInfo.cgst?.toLocaleString('en-IN')}</td>
                            </tr>
                          )}
                          {taxInfo.sgst > 0 && (
                            <tr style={{ background: '#f8fafc' }}>
                              <td colSpan="5" style={{ border: '1px solid #e2e8f0', padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#475569' }}>SGST (9%)</td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>₹{taxInfo.sgst?.toLocaleString('en-IN')}</td>
                            </tr>
                          )}
                          {taxInfo.igst > 0 && (
                            <tr style={{ background: '#f8fafc' }}>
                              <td colSpan="5" style={{ border: '1px solid #e2e8f0', padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#475569' }}>IGST (18%)</td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>₹{taxInfo.igst?.toLocaleString('en-IN')}</td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr style={{ background: '#ecfdf5' }}>
                        <td colSpan="5" style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontWeight: 800, textAlign: 'right', fontSize: '12px', color: '#15803d' }}>Grand Total (Inclusive of GST)</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '16px', fontWeight: 800, color: '#15803d', textAlign: 'right' }}>
                          ₹{selectedInvoice.grandTotal?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px', gap: '20px', borderTop: '2px solid #e2e8f0', paddingTop: '16px', textAlign: 'left' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Corporate Payment Remittance</div>
                      <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.5' }}>
                        <strong>Bank:</strong> HDFC Bank Ltd · <strong>Account Name:</strong> Acme Corp India Pvt Ltd<br />
                        <strong>A/C Number:</strong> 001234567890 · <strong>IFSC Code:</strong> HDFC0001234<br />
                        <strong>Swift Code:</strong> HDFCCINBB · <strong>UPI ID:</strong> acmecorp@hdfcbank
                      </div>
                      
                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', lineHeight: '1.4' }}>
                        <strong>Terms & Conditions:</strong><br />
                        1. Payment is due strictly within 30 days of the invoice issuance date.<br />
                        2. Please mention Invoice Number and PO Reference on all payment notification advices.
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: '240px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Amount in words:</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', margin: '4px 0 24px', lineHeight: '1.4' }}>{numberToWords(selectedInvoice.grandTotal)}</div>
                      
                      <div style={{ fontSize: '10px', color: '#475569' }}>For Acme Corp India Pvt Ltd</div>
                      <div style={{ margin: '16px 0 6px', height: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ borderBottom: '1px dotted #94a3b8', width: '130px', display: 'inline-block' }}></span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>Authorized Signatory</div>
                    </div>
                  </div>
                </div>

                {role !== 'VENDOR' && selectedInvoice.status !== 'PAID' && (
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={handleMarkPaid}>
                      <i className="ti ti-check"></i> Mark Paid (Reconcile)
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div className="card-head"><span className="card-title">All Invoices</span></div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>PO Ref</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      style={{ cursor: 'pointer', background: selectedInvoice?.id === inv.id ? 'var(--bg)' : '' }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                      <td>{inv.purchaseOrder?.poNumber}</td>
                      <td>{inv.vendor?.name}</td>
                      <td style={{ fontWeight: 600 }}>₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                      <td style={{ color: inv.status === 'OVERDUE' || inv.status === 'Overdue' ? 'var(--red)' : 'var(--text2)' }}>
                        {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                      </td>
                      <td>{badgeHtml(inv.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          {role !== 'VENDOR' && (inv.status === 'OVERDUE' || inv.status === 'Overdue') && (
                            <button className="btn btn-amber btn-xs" onClick={() => triggerEmailDirectly(inv, 'REMIND')}>
                              Remind
                            </button>
                          )}
                          <button className="btn btn-ghost btn-xs" onClick={() => setSelectedInvoice(inv)}>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
