import { useEffect, useState } from 'react';
import { getApprovals, approveQuotation, rejectQuotation } from '../services/approval.service.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [approvalsList, setApprovalsList] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [remarks, setRemarks] = useState('Approved. All ISO requirements met. Proceed with PO generation.');
  const [loading, setLoading] = useState(true);

  const fetchApprovalsList = async () => {
    try {
      setLoading(true);
      const data = await getApprovals();
      setApprovalsList(data);
      if (data.length > 0) {
        setSelectedApproval(data[0]);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const fallback = [
        {
          id: 'apr-042',
          status: 'PENDING',
          requestedAt: '2026-06-06T09:00:00Z',
          quotation: {
            id: 'q-042',
            quotationNumber: 'QTN-2026-0042',
            totalAmount: 378780,
            deliveryDays: 21,
            paymentTerms: 'Net 30',
            notes: 'Warranty: 2 years. ISO certified chairs.',
            rfq: { rfqNumber: 'RFQ-042', title: 'Office Furniture Procurement Q2' },
            vendor: { name: 'InfraSupplies Pvt Ltd', rating: 4.8 }
          }
        },
        {
          id: 'apr-041',
          status: 'PENDING',
          requestedAt: '2026-06-06T08:15:00Z',
          quotation: {
            id: 'q-041',
            quotationNumber: 'QTN-2026-0041',
            totalAmount: 48200,
            deliveryDays: 7,
            paymentTerms: 'Net 45',
            notes: 'Immediate stock availability.',
            rfq: { rfqNumber: 'RFQ-041', title: 'Stationery Supplies' },
            vendor: { name: 'OfficeEssentials Co.', rating: 3.2 }
          }
        }
      ];
      setApprovalsList(fallback);
      setSelectedApproval(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalsList();
  }, []);

  const handleAction = async (status) => {
    if (!selectedApproval) return;
    if (status === 'REJECTED' && !remarks.trim()) {
      toast.error('Rejection remarks are required');
      return;
    }

    try {
      if (status === 'APPROVED') {
        await approveQuotation(selectedApproval.id, remarks);
        toast.success('RFQ approved — Purchase Order generated automatically!');
        setTimeout(() => navigate('/pos'), 1200);
      } else {
        await rejectQuotation(selectedApproval.id, remarks);
        toast.info('RFQ rejected — vendor and buyer notified');
      }
      fetchApprovalsList();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const badgeHtml = (status) => {
    const map = {
      PENDING: 'amber',
      Pending: 'amber',
      APPROVED: 'green',
      Approved: 'green',
      REJECTED: 'red',
      Rejected: 'red'
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
            {selectedApproval && (
              <div className="card" style={{ marginBottom: '14px' }}>
                <div className="card-head" style={{ background: 'var(--amber-light)' }}>
                  <span className="card-title" style={{ color: 'var(--amber)' }}>
                    Approval Workflow — {selectedApproval.quotation?.rfq?.rfqNumber}
                  </span>
                  <span className="card-sub">
                    {selectedApproval.quotation?.vendor?.name} · ₹{selectedApproval.quotation?.totalAmount?.toLocaleString('en-IN')}
                  </span>
                  <div className="card-actions">{badgeHtml(selectedApproval.status)}</div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div className="tl-wrap" style={{ padding: 0 }}>
                    {[
                      { icon: '✓', color: 'green', title: 'RFQ Created', meta: 'Riya Sharma · Procurement Officer', body: `${selectedApproval.quotation?.rfq?.title}. Invitation sent to assigned vendors.`, line: true },
                      { icon: '✓', color: 'green', title: 'Quotations Received', meta: 'System · Automatically Synced', body: 'Quotation comparison report generated. Vendor selected for L1 approval.', line: true },
                      { icon: '✓', color: 'green', title: 'Selected for Approval', meta: 'Riya Sharma · L1 Recommendation', body: `${selectedApproval.quotation?.vendor?.name} proposed. Total value: ₹${selectedApproval.quotation?.totalAmount?.toLocaleString('en-IN')}`, line: true },
                      { icon: selectedApproval.status === 'PENDING' ? '⏳' : '✓', color: selectedApproval.status === 'PENDING' ? 'amber' : 'green', title: 'L1 Manager Approval', meta: 'Mgr. Vikram Patel · Awaiting Review · SLA: 24h', body: selectedApproval.status === 'APPROVED' ? `Approved: ${selectedApproval.remarks || remarks}` : 'Quotation details under review. Please approve or reject below.', line: true },
                      { icon: selectedApproval.status === 'APPROVED' ? '✓' : '○', color: selectedApproval.status === 'APPROVED' ? 'green' : 'gray', title: 'Purchase Order Generation', meta: selectedApproval.status === 'APPROVED' ? 'PO created automatically' : 'Awaiting approval to proceed', body: '', line: false }
                    ].map((t, idx) => (
                      <div className="tl-item" key={idx}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className={`tl-dot ${t.color}`}>{t.icon}</div>
                          {t.line && <div className="tl-vline"></div>}
                        </div>
                        <div className="tl-right" style={{ paddingBottom: t.line ? '16px' : '0' }}>
                          <div className="tl-title">{t.title}</div>
                          <div className="tl-meta">{t.meta}</div>
                          {t.body && <div className="tl-body">{t.body}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-head">
                <span className="card-title">Pending Approvals</span>
                <span className="nav-badge" style={{ borderRadius: '10px', padding: '2px 8px' }}>
                  {approvalsList.filter(x => x.status === 'PENDING').length}
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>RFQ</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Requested At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalsList.map(a => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedApproval(a)}
                      style={{ cursor: 'pointer', background: selectedApproval?.id === a.id ? 'var(--bg)' : '' }}
                    >
                      <td><div style={{ fontWeight: 600 }}>{a.quotation?.rfq?.rfqNumber}</div></td>
                      <td>{a.quotation?.vendor?.name}</td>
                      <td style={{ fontWeight: 600, color: 'var(--amber)' }}>₹{a.quotation?.totalAmount?.toLocaleString('en-IN')}</td>
                      <td>{new Date(a.requestedAt).toLocaleDateString('en-GB')}</td>
                      <td>{badgeHtml(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedApproval && (
            <div>
              <div className="card" style={{ marginBottom: '12px' }}>
                <div className="card-head"><span className="card-title">Quotation Summary</span></div>
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    ['Vendor', selectedApproval.quotation?.vendor?.name],
                    ['RFQ', selectedApproval.quotation?.rfq?.rfqNumber],
                    ['Delivery', `${selectedApproval.quotation?.deliveryDays} days`],
                    ['Rating', `${selectedApproval.quotation?.vendor?.rating || 4.5} ★`],
                    ['Payment', selectedApproval.quotation?.paymentTerms],
                    ['Warranty', '2 years'],
                    ['ISO', 'Certified']
                  ].map(([l, v]) => (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }} key={l}>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{l}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: '4px', borderTop: '2px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Total</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{selectedApproval.quotation?.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedApproval.status === 'PENDING' && (
                <div className="card">
                  <div className="card-head"><span className="card-title">Approval Action</span></div>
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div className="form-label" style={{ marginBottom: '6px' }}>Approval level</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                          L1 · Mgr. Patel
                        </div>
                        <i className="ti ti-arrow-right" style={{ color: 'var(--text3)' }}></i>
                        <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '11px', color: 'var(--text3)' }}>
                          L2 · Director
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Approver Remarks</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="Add conditions or comments..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleAction('REJECTED')}>
                        <i className="ti ti-x"></i> Reject
                      </button>
                      <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => handleAction('APPROVED')}>
                        <i className="ti ti-check"></i> Approve & PO
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
