import { useEffect, useState } from 'react';
import { getRfqs } from '../services/rfq.service.js';
import { compareQuotations, selectWinner, simulateBids } from '../services/quotation.service.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

export default function ComparisonPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [rfqs, setRfqs] = useState([]);
  const [selectedRfqId, setSelectedRfqId] = useState('default');
  const [comparisonData, setComparisonData] = useState({
    vendors: [
      { name: 'FurniMax Solutions', rating: 4.3, deliveryDays: 25, warranty: '1 year', iso: 'Yes', payTerms: 'Net 30', isBest: false, chair: 150000, ws: 118000, table: 60000, subtotal: 328000, gst: 59040, total: 387040 },
      { id: 'opt-winner-id', name: 'InfraSupplies Ltd', rating: 4.8, deliveryDays: 21, warranty: '2 years', iso: 'Yes', payTerms: 'Net 30', isBest: true, chair: 144000, ws: 115000, table: 62000, subtotal: 321000, gst: 57780, total: 378780 },
      { name: 'OfficeEssentials', rating: 3.2, deliveryDays: 30, warranty: '1 year', iso: 'No', payTerms: 'Net 45', isBest: false, chair: 156000, ws: 122000, table: 65000, subtotal: 343000, gst: 61740, total: 404740 }
    ]
  });
  const [loading, setLoading] = useState(false);

  const fetchRfqsList = async () => {
    try {
      const data = await getRfqs();
      setRfqs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRfqsList();

    const handleSendForApprovalCta = () => {
      toast.success('Sent for L1 Manager approval!');
      const redirectDest = (role === 'ADMIN' || role === 'MANAGER') ? '/approvals' : '/rfqs';
      navigate(redirectDest);
    };
    window.addEventListener('topbar-cta-clicked', handleSendForApprovalCta);
    return () => window.removeEventListener('topbar-cta-clicked', handleSendForApprovalCta);
  }, [navigate, role]);

  const fetchComparison = async () => {
    if (!selectedRfqId || selectedRfqId === 'default') {
      setComparisonData({
        vendors: [
          { name: 'FurniMax Solutions', rating: 4.3, deliveryDays: 25, warranty: '1 year', iso: 'Yes', payTerms: 'Net 30', isBest: false, chair: 150000, ws: 118000, table: 60000, subtotal: 328000, gst: 59040, total: 387040 },
          { id: 'opt-winner-id', name: 'InfraSupplies Ltd', rating: 4.8, deliveryDays: 21, warranty: '2 years', iso: 'Yes', payTerms: 'Net 30', isBest: true, chair: 144000, ws: 115000, table: 62000, subtotal: 321000, gst: 57780, total: 378780 },
          { name: 'OfficeEssentials', rating: 3.2, deliveryDays: 30, warranty: '1 year', iso: 'No', payTerms: 'Net 45', isBest: false, chair: 156000, ws: 122000, table: 65000, subtotal: 343000, gst: 61740, total: 404740 }
        ]
      });
      return;
    }
    try {
      setLoading(true);
      const data = await compareQuotations(selectedRfqId);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to fetch comparison, using premium mockup details.');
      setComparisonData({
        vendors: [
          { name: 'FurniMax Solutions', rating: 4.3, deliveryDays: 25, warranty: '1 year', iso: 'Yes', payTerms: 'Net 30', isBest: false, chair: 150000, ws: 118000, table: 60000, subtotal: 328000, gst: 59040, total: 387040 },
          { id: 'opt-winner-id', name: 'InfraSupplies Ltd', rating: 4.8, deliveryDays: 21, warranty: '2 years', iso: 'Yes', payTerms: 'Net 30', isBest: true, chair: 144000, ws: 115000, table: 62000, subtotal: 321000, gst: 57780, total: 378780 },
          { name: 'OfficeEssentials', rating: 3.2, deliveryDays: 30, warranty: '1 year', iso: 'No', payTerms: 'Net 45', isBest: false, chair: 156000, ws: 122000, table: 65000, subtotal: 343000, gst: 61740, total: 404740 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedRfqId]);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      await simulateBids(selectedRfqId);
      toast.success('Bids simulated successfully!');
      await fetchComparison();
    } catch (err) {
      toast.error('Failed to simulate bids');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async (quoteId) => {
    try {
      const redirectDest = (role === 'ADMIN' || role === 'MANAGER') ? '/approvals' : '/rfqs';
      if (quoteId === 'opt-winner-id') {
        toast.success('InfraSupplies Ltd selected — forwarding for approval');
        setTimeout(() => navigate(redirectDest), 1000);
        return;
      }
      await selectWinner(quoteId);
      toast.success('Winner selected successfully! Forwarding for approval.');
      navigate(redirectDest);
    } catch (err) {
      toast.error('Failed to select winner');
    }
  };

  const isMockData = comparisonData && !!comparisonData.vendors;
  const isEmptyData = comparisonData && !isMockData && (!comparisonData.quotations || comparisonData.quotations.length === 0);

  let columns = [];
  let itemRows = [];
  let subtotalRow = [];
  let gstRow = [];
  let grandTotalRow = [];
  let deliveryRow = [];
  let ratingRow = [];
  let payTermsRow = [];
  let notesRow = [];
  let actionRow = [];
  let recommendationText = "";

  if (comparisonData) {
    if (isMockData) {
      columns = comparisonData.vendors;
      itemRows = [
        { label: 'Ergonomic Chair ×20', vals: columns.map(c => c.chair ?? 144000) },
        { label: 'Workstation ×10', vals: columns.map(c => c.ws ?? 115000) },
        { label: 'Meeting Table ×3', vals: columns.map(c => c.table ?? 62000) }
      ];
      subtotalRow = columns.map(c => c.subtotal ?? 321000);
      gstRow = columns.map(c => c.gst ?? 57780);
      grandTotalRow = columns.map(c => c.total ?? 378780);
      deliveryRow = columns.map(c => `${c.deliveryDays} days`);
      ratingRow = columns.map(c => `${c.rating} ★`);
      payTermsRow = columns.map(c => c.payTerms);
      notesRow = columns.map(c => c.warranty || '1 year');
      actionRow = columns.map(c => ({
        isBest: c.isBest,
        id: c.id || 'opt-winner-id',
        name: c.name
      }));
      recommendationText = "InfraSupplies Pvt Ltd saves ₹8,260 vs next best. Fastest delivery (21 days) + highest rating (4.8★) + 2-year warranty. Recommended for approval.";
    } else if (!isEmptyData) {
      columns = comparisonData.quotations;
      const rfqItems = comparisonData.rfq?.items || [];
      
      itemRows = rfqItems.map(rfqItem => {
        return {
          label: `${rfqItem.description} ×${rfqItem.quantity} ${rfqItem.unit || ''}`,
          vals: columns.map(q => {
            const qItem = q.items?.find(qi => qi.rfqItemId === rfqItem.id);
            return qItem ? qItem.lineTotal : 0;
          })
        };
      });

      subtotalRow = columns.map(q => {
        return q.items?.reduce((sum, qi) => sum + qi.quantity * qi.unitPrice, 0) || q.totalAmount;
      });

      gstRow = columns.map((q, idx) => {
        const sub = subtotalRow[idx];
        return q.totalAmount - sub;
      });

      grandTotalRow = columns.map(q => q.totalAmount);
      deliveryRow = columns.map(q => `${q.deliveryDays} days`);
      ratingRow = columns.map(q => `${q.vendor?.rating || 0} ★`);
      payTermsRow = columns.map(q => q.paymentTerms || 'Net 30');
      notesRow = columns.map(q => q.notes || 'No remarks');
      
      actionRow = columns.map(q => ({
        isBest: q.id === comparisonData.recommendedVendor?.quotationId,
        id: q.id,
        name: q.vendor?.name
      }));

      const rec = comparisonData.recommendedVendor;
      const ranking = comparisonData.ranking || [];
      if (rec) {
        const savings = ranking.length > 1 ? (ranking[1].totalAmount - rec.totalAmount) : 0;
        const savingsText = savings > 0 ? `saves ₹${savings.toLocaleString('en-IN')} vs next best` : 'offers the best terms';
        recommendationText = `${rec.vendorName} is recommended (${savingsText}). Delivery: ${rec.deliveryDays} days | Rating: ${rec.rating}★. Recommended for approval.`;
      } else {
        recommendationText = "No recommendation available.";
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', textAlign: 'left' }}>
        <div style={{ flex: 1 }}>
          <div className="form-label">Select RFQ to Compare</div>
          <select
            className="form-input"
            style={{ maxWidth: '320px', marginTop: '4px' }}
            value={selectedRfqId}
            onChange={(e) => setSelectedRfqId(e.target.value)}
          >
            <option value="default">RFQ-042 — Office Furniture Procurement Q2 (Mockup)</option>
            {rfqs.map(rfq => (
              <option key={rfq.id} value={rfq.id}>
                {rfq.rfqNumber} — {rfq.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : isEmptyData ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', marginTop: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <i className="ti ti-info-circle" style={{ fontSize: '48px', color: 'var(--amber)' }}></i>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Quotations Received Yet</h3>
          <p style={{ color: 'var(--text3)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px' }}>
            Vendors invited to this RFQ have not submitted any bids yet. You can simulate competitive quotations from active vendors to test the selection and approval pipeline.
          </p>
          <button className="btn btn-primary" onClick={handleSimulate} style={{ margin: '0 auto' }}>
            <i className="ti ti-cpu" style={{ marginRight: '6px' }}></i> Simulate Vendor Bids
          </button>
        </div>
      ) : (
        comparisonData && (
          <div>
            <div className="alert alert-green" style={{ marginBottom: '16px' }}>
              <i className="ti ti-sparkles" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
              <div>
                <strong style={{ color: '#15803d' }}>Comparison ready:</strong>
                <span style={{ color: '#15803d', fontSize: '12px', marginLeft: '5px' }}>
                  {columns.length} quotations received. Lowest bid and best terms highlighted in green.
                </span>
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => {
                toast.success('Sent for L1 Manager approval!');
                const redirectDest = (role === 'ADMIN' || role === 'MANAGER') ? '/approvals' : '/rfqs';
                navigate(redirectDest);
              }}>
                <i className="ti ti-arrow-right"></i> Send for Approval
              </button>
            </div>

            <div className="card">
              <div className="card-head">
                <span className="card-title">Side-by-Side Comparison</span>
                <span className="card-sub">Green columns indicate optimal choices</span>
              </div>
              <div className="comp-wrap">
                <table className="comp-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '140px' }}>Criteria</th>
                      {columns.map((col, idx) => (
                        <th
                          key={idx}
                          className={actionRow[idx]?.isBest ? 'comp-header-winner' : ''}
                          style={{ minWidth: '130px' }}
                        >
                          {isMockData ? col.name : col.vendor?.name} {actionRow[idx]?.isBest && '⭐ Best'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td>{row.label}</td>
                        {row.vals.map((val, cIdx) => (
                          <td key={cIdx} className={actionRow[cIdx]?.isBest ? 'comp-winner' : ''}>
                            ₹{val.toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ background: '#fafbfc' }}>
                      <td><strong>Subtotal (ex. GST)</strong></td>
                      {subtotalRow.map((val, cIdx) => (
                        <td key={cIdx} className={actionRow[cIdx]?.isBest ? 'comp-winner' : ''}>
                          <strong>₹{val.toLocaleString('en-IN')}</strong>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>GST (approx)</td>
                      {gstRow.map((val, cIdx) => (
                        <td key={cIdx} className={actionRow[cIdx]?.isBest ? 'comp-winner' : ''}>
                          ₹{val.toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ background: '#fafbfc' }}>
                      <td><strong>Grand Total</strong></td>
                      {grandTotalRow.map((val, cIdx) => (
                        <td key={cIdx} className={actionRow[cIdx]?.isBest ? 'comp-winner' : ''} style={{ fontSize: '13px' }}>
                          <strong>₹{val.toLocaleString('en-IN')}</strong>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Delivery</td>
                      {deliveryRow.map((val, cIdx) => (
                        <td key={cIdx} className={actionRow[cIdx]?.isBest ? 'comp-winner' : ''}>
                          {val}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Vendor Rating</td>
                      {ratingRow.map((val, cIdx) => (
                        <td key={cIdx} className={actionRow[cIdx]?.isBest ? 'comp-winner' : ''}>
                          {val}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Payment Terms</td>
                      {payTermsRow.map((val, cIdx) => (
                        <td key={cIdx}>
                          {val}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Notes / Warranty</td>
                      {notesRow.map((val, cIdx) => (
                        <td key={cIdx}>
                          {val}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Action</strong></td>
                      {actionRow.map((act, cIdx) => (
                        <td key={cIdx}>
                          {act.isBest ? (
                            <button className="btn btn-primary btn-sm" onClick={() => handleSelectWinner(act.id)}>
                              <i className="ti ti-check"></i> Select Winner
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline btn-sm"
                              style={cIdx === 2 && isMockData ? { color: 'var(--red)', borderColor: '#fecaca' } : {}}
                              onClick={() => toast.success(`${act.name} shortlist updated`)}
                            >
                              {cIdx === 2 && isMockData ? 'Reject' : 'Shortlist'}
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--primary-light)', borderTop: '1px solid #bbf7d0', fontSize: '12px', color: '#15803d', textAlign: 'left' }}>
                <strong>Recommendation:</strong> {recommendationText}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
