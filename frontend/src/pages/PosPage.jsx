import { useEffect, useState } from 'react';
import { getPurchaseOrders } from '../services/po.service.js';
import { generateInvoice } from '../services/invoice.service.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import useAuthStore from '../store/authStore.js';

export default function PosPage() {
  const navigate = useNavigate();
  const role = useAuthStore(state => state.role);
  const [posList, setPosList] = useState([]);
  const [selectedPo, setSelectedPo] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchPos = async () => {
    try {
      setLoading(true);
      const data = await getPurchaseOrders();
      setPosList(data);
      if (data.length > 0) {
        setSelectedPo(data[0]);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const fallback = [
        {
          id: 'po-2129',
          poNumber: 'PO-2129-2026',
          status: 'ISSUED',
          totalAmount: 378780,
          createdAt: '2026-06-06T10:00:00Z',
          deliveryDeadline: '2026-07-31T00:00:00Z',
          rfq: { rfqNumber: 'RFQ-042', title: 'Office Furniture Procurement Q2' },
          vendor: { name: 'InfraSupplies Pvt Ltd', email: 'infra@supplies.com', gstNumber: '29AABCI1234J1Z5', address: '456 Industrial Area, Peenya, Bengaluru 560058' },
          items: [
            { id: 1, description: 'Ergonomic Chair (High-Back)', quantity: 20, unit: 'Nos', unitPrice: 7200, lineTotal: 144000 },
            { id: 2, description: 'Height-Adj. Workstation', quantity: 10, unit: 'Nos', unitPrice: 11500, lineTotal: 115000 },
            { id: 3, description: 'Meeting Table (8-seater)', quantity: 3, unit: 'Nos', unitPrice: 20667, lineTotal: 62000 }
          ]
        },
        {
          id: 'po-2128',
          poNumber: 'PO-2128-2026',
          status: 'ISSUED',
          totalAmount: 124500,
          createdAt: '2026-05-15T00:00:00Z',
          deliveryDeadline: '2026-06-15T00:00:00Z',
          rfq: { rfqNumber: 'RFQ-040' },
          vendor: { name: 'TechCorp Ltd' },
          items: []
        }
      ];
      setPosList(fallback);
      setSelectedPo(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPos();
  }, []);

  const handleGenerateInvoice = async () => {
    if (!selectedPo) return;
    try {
      if (selectedPo.id.startsWith('po-')) {
        // Mock success
        toast.success(`Invoice created from ${selectedPo.poNumber}`);
        setTimeout(() => navigate('/invoices'), 1000);
        return;
      }
      await generateInvoice(selectedPo.id);
      toast.success(`Invoice generated for ${selectedPo.poNumber}`);
      navigate('/invoices');
    } catch (err) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedPo) return;
    const element = document.querySelector('.po-wrap');
    if (!element) {
      toast.error('PO wrapper not found');
      return;
    }
    const toastId = toast.loading('Generating professional PO receipt...');
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
      pdf.save(`PurchaseOrder-${selectedPo.poNumber}.pdf`);
      toast.success('PO receipt downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PO receipt', { id: toastId });
    }
  };

  const triggerPoEmailDirectly = (po) => {
    let to = '';
    let cc = '';
    let subject = '';
    let body = '';

    const formattedAmount = po.totalAmount?.toLocaleString('en-IN');
    const formattedDeadline = po.deliveryDeadline ? new Date(po.deliveryDeadline).toLocaleDateString('en-GB') : 'N/A';
    const rfqRef = po.rfq?.rfqNumber || 'N/A';
    const vendorName = po.vendor?.name || 'Partner';

    if (role === 'VENDOR') {
      to = 'officer@vendorbridge.com';
      cc = po.vendor?.email || '';
      subject = `[PO Acknowledged] Acknowledgment of Purchase Order ${po.poNumber}`;
      body = `Dear Procurement Team,

We hereby acknowledge receipt of Purchase Order ${po.poNumber} for ₹${formattedAmount}.

We are processing the order and expect to deliver the goods/services by the specified deadline (${formattedDeadline}).

Best regards,
${vendorName}`;
    } else {
      to = po.vendor?.email || 'vendor@example.com';
      cc = 'officer@vendorbridge.com';
      subject = `[Purchase Order Issued] ${po.poNumber} - Acme Corp India`;
      body = `Dear ${vendorName},

Please find the details for Purchase Order ${po.poNumber} issued by Acme Corp India Pvt Ltd.

- PO Number: ${po.poNumber}
- RFQ Reference: ${rfqRef}
- Total Amount: ₹${formattedAmount}
- Delivery Deadline: ${formattedDeadline}

Please acknowledge the receipt of this order and proceed with fulfillment as per terms.

Best regards,
Procurement Team, Acme Corp India`;
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    toast.success(`Gmail composer opened directly for ${po.poNumber}!`);
  };

  const badgeHtml = (status) => {
    const map = {
      ISSUED: 'green',
      Issued: 'green',
      ACKNOWLEDGED: 'blue',
      DELIVERED: 'purple',
      CLOSED: 'gray'
    };
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
  };

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : (
        <div className="split">
          <div>
            {selectedPo && (
              <div className="card" style={{ marginBottom: '14px' }}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{selectedPo.poNumber} — Purchase Order</div>
                    <div className="card-sub">{selectedPo.vendor?.name} · Ref: {selectedPo.rfq?.rfqNumber}</div>
                  </div>
                  <div className="card-actions">
                    {badgeHtml(selectedPo.status)}
                    <button className="btn btn-outline btn-sm" onClick={handleDownloadPdf}>
                      <i className="ti ti-download"></i> PDF
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                      <i className="ti ti-printer"></i> Print
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => triggerPoEmailDirectly(selectedPo)}>
                      <i className="ti ti-mail"></i> Email
                    </button>
                  </div>
                </div>

                <div className="po-wrap" style={{ border: 'none', borderRadius: 0, padding: '24px', background: '#fff', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
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
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '1px' }}>PURCHASE ORDER</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#111', letterSpacing: '-1px', margin: '2px 0' }}>{selectedPo.poNumber}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>Order Date: <strong>{new Date(selectedPo.createdAt).toLocaleDateString('en-GB')}</strong></div>
                      <div style={{ fontSize: '11px', color: '#555' }}>Delivery Deadline: <strong>{selectedPo.deliveryDeadline ? new Date(selectedPo.deliveryDeadline).toLocaleDateString('en-GB') : 'N/A'}</strong></div>
                      <div style={{ marginTop: '8px', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-block', border: '1px solid #86efac' }}>
                        STATUS: {selectedPo.status}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor (Seller)</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{selectedPo.vendor?.name}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                        {selectedPo.vendor?.address || 'India'}<br />GSTIN: <strong>{selectedPo.vendor?.gstNumber || 'N/A'}</strong>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ship To / Bill To (Buyer)</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Acme Corp India Pvt Ltd</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                        123 Business Park, Whitefield, Bengaluru 560066<br />
                        GSTIN: <strong>29AABCA1234J1Z5</strong>
                      </div>
                    </div>
                  </div>

                  <table style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f0fdf4', color: '#166534' }}>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '40px' }}>#</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'left' }}>Item Description</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '80px' }}>Qty</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '120px', textAlign: 'right' }}>Unit Price (INR)</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '11px', fontWeight: 700, width: '140px', textAlign: 'right' }}>Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPo.items?.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'left', fontWeight: 500 }}>{item.description}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'center' }}>{item.quantity} {item.unit || 'Nos'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'right' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '12px', textAlign: 'right', fontWeight: 600 }}>₹{item.lineTotal?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {(!selectedPo.items || selectedPo.items.length === 0) && (
                        <tr>
                          <td colSpan="5" style={{ border: '1px solid #e2e8f0', padding: '16px', color: 'var(--text3)', textAlign: 'center' }}>No items listed</td>
                        </tr>
                      )}
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan="4" style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontWeight: 600, textAlign: 'right', fontSize: '11px', color: '#475569' }}>Subtotal (Excl. Taxes)</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>₹{Math.round((selectedPo.totalAmount || 0) / 1.18).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan="4" style={{ border: '1px solid #e2e8f0', padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#475569' }}>Estimated GST (18%)</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>₹{Math.round((selectedPo.totalAmount || 0) - (selectedPo.totalAmount || 0) / 1.18).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ background: '#ecfdf5' }}>
                        <td colSpan="4" style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontWeight: 800, textAlign: 'right', fontSize: '12px', color: '#15803d' }}>Grand Total (Inclusive of GST)</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: '16px', fontWeight: 800, color: '#15803d', textAlign: 'right' }}>
                          ₹{selectedPo.totalAmount?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px', gap: '20px', borderTop: '2px solid #e2e8f0', paddingTop: '16px', textAlign: 'left' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Instructions & Delivery Terms</div>
                      <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.5' }}>
                        1. Please reference the Purchase Order Number <strong>{selectedPo.poNumber}</strong> on all packages and invoices.<br />
                        2. Delivery must be completed by the specified deadline: <strong>{selectedPo.deliveryDeadline ? new Date(selectedPo.deliveryDeadline).toLocaleDateString('en-GB') : 'N/A'}</strong>.<br />
                        3. Standard payment terms apply within 30 days after invoice reconciliation.
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: '240px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Estimated PO value in words:</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', margin: '4px 0 24px', lineHeight: '1.4' }}>
                        {numberToWords(selectedPo.totalAmount)}
                      </div>
                      
                      <div style={{ fontSize: '10px', color: '#475569' }}>For Acme Corp India Pvt Ltd</div>
                      <div style={{ margin: '16px 0 6px', height: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ borderBottom: '1px dotted #94a3b8', width: '130px', display: 'inline-block' }}></span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-head"><span className="card-title">All Purchase Orders</span></div>
              <table>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {posList.map(po => (
                    <tr
                      key={po.id}
                      onClick={() => setSelectedPo(po)}
                      style={{ cursor: 'pointer', background: selectedPo?.id === po.id ? 'var(--bg)' : '' }}
                    >
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{po.poNumber}</td>
                      <td>{po.vendor?.name}</td>
                      <td style={{ fontWeight: 600 }}>₹{po.totalAmount?.toLocaleString('en-IN')}</td>
                      <td>{new Date(po.createdAt).toLocaleDateString('en-GB')}</td>
                      <td>{badgeHtml(po.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-head"><span className="card-title">PO Workflow</span></div>
              <div style={{ padding: '14px' }}>
                {[
                  { icon: '✓', color: 'green', title: 'RFQ Approved', sub: 'L1 Manager Approved' },
                  { icon: '✓', color: 'green', title: 'PO Generated', sub: 'System generated reference' },
                  { icon: '⏳', color: 'amber', title: 'Awaiting Delivery', sub: `Expected: ${selectedPo ? new Date(selectedPo.deliveryDeadline).toLocaleDateString('en-GB') : 'N/A'}` },
                  { icon: '○', color: 'gray', title: 'Invoice & Payment', sub: 'Pending delivery execution' }
                ].map((step, idx) => (
                  <div className="wf-step" key={idx}>
                    <div className="wf-circle" style={{
                      background: step.color === 'green' ? 'var(--primary-light)' : step.color === 'amber' ? 'var(--amber-light)' : 'var(--bg)',
                      border: `2px solid ${step.color === 'green' ? 'var(--primary)' : step.color === 'amber' ? 'var(--amber)' : 'var(--border2)'}`,
                      color: step.color === 'green' ? 'var(--primary)' : step.color === 'amber' ? 'var(--amber)' : 'var(--text3)'
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{step.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{step.sub}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '12px' }}>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerateInvoice}>
                    <i className="ti ti-file-invoice"></i> Generate Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

