import { useEffect, useState } from 'react';
import { getQuotations, submitQuotation } from '../services/quotation.service.js';
import { getRfqs } from '../services/rfq.service.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const role = useAuthStore(state => state.role);
  const [quotations, setQuotations] = useState([]);
  const [rfqsList, setRfqsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Quotation form states (Vendor view)
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState(14);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [itemPrices, setItemPrices] = useState({}); // { rfqItemId: unitPrice }

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qData, rfqData] = await Promise.allSettled([
        getQuotations(),
        getRfqs()
      ]);
      if (qData.status === 'fulfilled') setQuotations(qData.value);
      if (rfqData.status === 'fulfilled') {
        setRfqsList(rfqData.value);
        if (rfqData.value.length > 0) {
          handleSelectRfq(rfqData.value[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRfq = (rfq) => {
    setSelectedRfq(rfq);
    // Initialize item prices
    const prices = {};
    rfq.items?.forEach(item => {
      prices[item.id] = 0;
    });
    setItemPrices(prices);
  };

  const handlePriceChange = (itemId, val) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: Number(val)
    }));
  };

  const calculateTotal = () => {
    if (!selectedRfq) return 0;
    let subtotal = 0;
    selectedRfq.items?.forEach(item => {
      const price = itemPrices[item.id] || 0;
      subtotal += price * item.quantity;
    });
    return subtotal;
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!selectedRfq) return;

    const subtotal = calculateTotal();
    if (subtotal <= 0) {
      toast.error('Please input unit prices for the items');
      return;
    }

    const items = selectedRfq.items.map(item => ({
      rfqItemId: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: itemPrices[item.id] || 0,
      taxPercent: 18, // Default 18% GST
      lineTotal: (itemPrices[item.id] || 0) * item.quantity * 1.18
    }));

    const payload = {
      rfqId: selectedRfq.id,
      deliveryDays: Number(deliveryDays),
      validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days valid
      paymentTerms,
      notes,
      totalAmount: subtotal * 1.18,
      items
    };

    try {
      await submitQuotation(payload);
      toast.success('Quotation submitted successfully!');
      fetchData();
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quotation');
    }
  };

  const badgeHtml = (status) => {
    const map = {
      SUBMITTED: 'blue',
      UNDER_REVIEW: 'amber',
      ACCEPTED: 'green',
      REJECTED: 'red'
    };
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
  };

  // Vendor view: Submission form + Statuses
  const renderVendorView = () => {
    const grandTotal = calculateTotal() * 1.18;

    return (
      <div className="split">
        <div>
          {selectedRfq ? (
            <div className="card">
              <div className="card-head">
                <span className="card-title">Quotation Form</span>
                <span className="card-sub">RFQ: {selectedRfq.rfqNumber} — {selectedRfq.title}</span>
              </div>
              <form onSubmit={handleSubmitQuote}>
                <table style={{ margin: '10px 0' }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit Price (₹) *</th>
                      <th>GST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRfq.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>
                          <input
                            type="number"
                            required
                            min="1"
                            className="form-input"
                            style={{ width: '100px' }}
                            value={itemPrices[item.id] || ''}
                            onChange={e => handlePriceChange(item.id, e.target.value)}
                            placeholder="Unit Price"
                          />
                        </td>
                        <td>18%</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          ₹{((itemPrices[item.id] || 0) * item.quantity * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="form-grid" style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Delivery Timeline (days) *</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={deliveryDays}
                      onChange={e => setDeliveryDays(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <select className="form-input" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="50% advance">50% advance / COD</option>
                    </select>
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Additional Comments / Remarks</label>
                    <textarea
                      className="form-input"
                      rows="2"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. ISO 9001 certified products. Warranty: 2 years."
                    />
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                    Grand Total (incl. 18% GST): <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>
                      ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </strong>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <i className="ti ti-send"></i> Submit Quotation
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)' }}>
              No Open RFQs found to quote for.
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="card-head"><span className="card-title">Select Open RFQ</span></div>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {rfqsList.filter(r => r.status === 'PUBLISHED').map(rfq => (
                <div
                  key={rfq.id}
                  onClick={() => handleSelectRfq(rfq)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    background: selectedRfq?.id === rfq.id ? 'var(--primary-light)' : '#fff',
                    borderColor: selectedRfq?.id === rfq.id ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '12px' }}>{rfq.rfqNumber}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{rfq.title}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">My Submissions</span></div>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {quotations.map(q => (
                <div key={q.id} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '11px' }}>{q.quotationNumber}</span>
                    {badgeHtml(q.status)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                    Value: ₹{q.totalAmount?.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Procurement View: All quotations submitted
  const renderProcurementView = () => (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Submitted Quotations</span>
        <span className="card-sub">{quotations.length} received</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Quote Number</th>
            <th>RFQ</th>
            <th>Vendor</th>
            <th>Delivery Timeline</th>
            <th>Amount (incl. GST)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {quotations.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No quotations received yet</td>
            </tr>
          ) : (
            quotations.map(q => (
              <tr key={q.id}>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{q.quotationNumber}</td>
                <td>{q.rfq?.rfqNumber || 'RFQ-042'}</td>
                <td>{q.vendor?.name}</td>
                <td>{q.deliveryDays} days</td>
                <td style={{ fontWeight: 600 }}>₹{q.totalAmount?.toLocaleString('en-IN')}</td>
                <td>{badgeHtml(q.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : role === 'VENDOR' ? (
        renderVendorView()
      ) : (
        renderProcurementView()
      )}
    </div>
  );
}
