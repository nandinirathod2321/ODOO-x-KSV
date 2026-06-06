import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore.js';
import { getRfqs } from '../services/rfq.service.js';
import { getApprovals, approveQuotation, rejectQuotation } from '../services/approval.service.js';
import { getInvoices } from '../services/invoice.service.js';
import { getPurchaseOrders } from '../services/po.service.js';
import { getVendors } from '../services/vendor.service.js';
import { getActivityLogs } from '../services/activity.service.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const role = useAuthStore(state => state.role);
  const navigate = useNavigate();

  // Data states
  const [rfqs, setRfqs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (role === 'PROCUREMENT_OFFICER' || role === 'ADMIN') {
          const [rfqData, invData, venData, logData, aprData] = await Promise.allSettled([
            getRfqs(),
            getInvoices(),
            getVendors(),
            getActivityLogs(),
            getApprovals()
          ]);
          if (rfqData.status === 'fulfilled') setRfqs(rfqData.value);
          if (invData.status === 'fulfilled') setInvoices(invData.value);
          if (venData.status === 'fulfilled') setVendors(venData.value);
          if (logData.status === 'fulfilled') setLogs(logData.value);
          if (aprData.status === 'fulfilled') setApprovals(aprData.value);
        } else if (role === 'MANAGER') {
          const [aprData, poData, logData] = await Promise.allSettled([
            getApprovals(),
            getPurchaseOrders(),
            getActivityLogs()
          ]);
          if (aprData.status === 'fulfilled') setApprovals(aprData.value);
          if (poData.status === 'fulfilled') setPos(poData.value);
          if (logData.status === 'fulfilled') setLogs(logData.value);
        } else if (role === 'VENDOR') {
          const [rfqData, poData] = await Promise.allSettled([
            getRfqs(),
            getPurchaseOrders()
          ]);
          if (rfqData.status === 'fulfilled') setRfqs(rfqData.value);
          if (poData.status === 'fulfilled') setPos(poData.value);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [role]);

  // Subscribe to topbar CTA click
  useEffect(() => {
    const handleCta = (e) => {
      if (e.detail.path === '/') {
        if (role === 'PROCUREMENT_OFFICER') navigate('/rfqs');
        else if (role === 'MANAGER' || role === 'ADMIN') navigate('/reports');
      }
    };
    window.addEventListener('topbar-cta-clicked', handleCta);
    return () => window.removeEventListener('topbar-cta-clicked', handleCta);
  }, [role, navigate]);

  // Helper render components
  const starRating = (r) => {
    let s = '';
    const rounded = Math.round(r || 4);
    for (let i = 1; i <= 5; i++) {
      s += i <= rounded ? '★' : '☆';
    }
    return <span style={{ color: '#f59e0b' }}>{s}</span>;
  };

  const badgeHtml = (status) => {
    const map = {
      ACTIVE: 'green',
      Active: 'green',
      APPROVED: 'green',
      Approved: 'green',
      PAID: 'green',
      Paid: 'green',
      PENDING: 'amber',
      Pending: 'amber',
      BLACKLISTED: 'red',
      Blacklisted: 'red',
      OVERDUE: 'red',
      Overdue: 'red',
      DRAFT: 'gray',
      Draft: 'gray',
      SUBMITTED: 'blue',
      Submitted: 'blue',
      URGENT: 'red',
      Urgent: 'red',
      NORMAL: 'gray',
      Normal: 'gray'
    };
    const c = map[status] || 'gray';
    return <span className={`badge badge-${c}`}>{status}</span>;
  };

  const kpiCard = (icon, iconBg, iconColor, accent, label, val, delta, deltaColor) => (
    <div className="kpi-card" key={label}>
      <div className="kpi-accent" style={{ background: accent }}></div>
      <div className="kpi-icon" style={{ background: iconBg, color: iconColor }}>
        <i className={`ti ${icon}`}></i>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{ color: iconColor }}>{val}</div>
      <div className="kpi-delta" style={{ color: deltaColor }}>{delta}</div>
    </div>
  );

  // Quick actions for Manager
  const handleQuickApprove = async (id, index) => {
    try {
      await approveQuotation(id, 'Approved via dashboard quick action');
      toast.success('Quotation approved successfully');
      setApprovals(prev => prev.map((ap, idx) => idx === index ? { ...ap, status: 'APPROVED' } : ap));
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleQuickReject = async (id, index) => {
    try {
      await rejectQuotation(id, 'Rejected via dashboard quick action');
      toast.info('Quotation rejected');
      setApprovals(prev => prev.map((ap, idx) => idx === index ? { ...ap, status: 'REJECTED' } : ap));
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  // 1. Procurement Officer Dashboard
  const renderProcurementOfficer = () => {
    const activeRfqCount = rfqs.filter(r => r.status === 'PUBLISHED').length || 3;
    const pendingApprovalCount = approvals.filter(a => a.status === 'PENDING').length || 2;
    const totalSpend = '₹12.4L';
    const openInvoiceCount = invoices.filter(i => i.status === 'PENDING').length || 2;

    const recentLogs = logs.length ? logs.slice(0, 4) : [
      { id: 1, eventType: 'RFQ Created', message: 'RFQ-042 issued for Office Furniture Q2', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 2, eventType: 'Quote Received', message: 'InfraSupplies submitted quote for RFQ-042', createdAt: new Date(Date.now() - 14400000).toISOString() },
      { id: 3, eventType: 'PO Approved', message: 'PO-2129 Approved by Vikram Patel', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 4, eventType: 'Invoice Received', message: 'Invoice INV-0081 received from TechCorp Ltd', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ];

    return (
      <div>
        <div className="kpi-grid">
          {kpiCard('ti-file-description', 'var(--primary-light)', 'var(--primary)', 'var(--primary)', 'Active RFQs', activeRfqCount, '↑ 3 this week', 'var(--primary)')}
          {kpiCard('ti-clock', 'var(--amber-light)', 'var(--amber)', 'var(--amber)', 'Pending Approvals', pendingApprovalCount, '2 urgent today', 'var(--red)')}
          {kpiCard('ti-currency-rupee', 'var(--blue-light)', 'var(--blue)', 'var(--blue)', 'Monthly Spend', totalSpend, 'Budget 57% used', 'var(--text3)')}
          {kpiCard('ti-file-invoice', 'var(--red-light)', 'var(--red)', 'var(--red)', 'Open Invoices', openInvoiceCount, '₹84,000 outstanding', 'var(--red)')}
        </div>

        <div className="qa-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="qa-btn" onClick={() => navigate('/rfqs')}><div className="qa-icon"><i className="ti ti-file-plus"></i></div><div className="qa-text">New RFQ</div></div>
          <div className="qa-btn" onClick={() => navigate('/comparison')}><div className="qa-icon"><i className="ti ti-table"></i></div><div className="qa-text">Compare Quotes</div></div>
          <div className="qa-btn" onClick={() => navigate('/pos')}><div className="qa-icon"><i className="ti ti-package"></i></div><div className="qa-text">Purchase Orders</div></div>
          <div className="qa-btn" onClick={() => navigate('/invoices')}><div className="qa-icon"><i className="ti ti-file-invoice"></i></div><div className="qa-text">Invoices</div></div>
        </div>

        <div className="split-3">
          <div>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Recent Procurement Activity</span>
                <div className="card-actions">
                  <span className="card-sub">Last 7 days</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/activity')}>View all →</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Event</th><th>Description</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {recentLogs.map(log => (
                    <tr key={log.id}>
                      <td><div style={{ fontWeight: 600 }}>{log.eventType}</div></td>
                      <td><span style={{ fontSize: '11px', color: 'var(--text2)' }}>{log.message}</span></td>
                      <td style={{ color: 'var(--text3)' }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head"><span className="card-title">Procurement Funnel</span></div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['RFQ → Quotation', 9, 12, 'var(--primary)'],
                  ['Quotation → Approval', 5, 9, 'var(--amber)'],
                  ['Approval → PO', 4, 4, 'var(--primary)'],
                  ['PO → Invoice', 3, 4, 'var(--blue)']
                ].map(([l, v, t, c]) => (
                  <div key={l}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{l}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: c }}>{v}/{t}</span>
                    </div>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width: `${Math.round((v / t) * 100)}%`, background: c }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Monthly Spend</span>
                <div className="card-actions">
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>↑ 18% MoM</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>Report →</button>
                </div>
              </div>
              <div className="chart-wrap">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text3)' }}>₹ Lakhs</span>
                </div>
                <div className="chart-bars">
                  {[
                    ['Jan', 35, 1.4],
                    ['Feb', 55, 2.2],
                    ['Mar', 42, 1.7],
                    ['Apr', 70, 2.8],
                    ['May', 60, 2.4],
                    ['Jun', 85, 3.4]
                  ].map(([m, h, v]) => (
                    <div className="bar-col" key={m}>
                      <div className="bar-val">{v}L</div>
                      <div className={`bar-fill ${m === 'Jun' ? 'highlight' : ''}`} style={{ height: `${h}%` }}></div>
                      <div className="bar-label">{m}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>YTD</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>₹12.4L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Budget</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>₹20L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Utilised</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--amber)' }}>62%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><span className="card-title">Action Required</span></div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="alert alert-red">
                  <i className="ti ti-alert-triangle" style={{ color: 'var(--red)', fontSize: '15px', flexShrink: 0, marginTop: '1px' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)' }}>Invoice overdue</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>INV-0081 · TechCorp · ₹1,46,910</div>
                  </div>
                  <button className="btn btn-danger btn-xs" onClick={() => navigate('/invoices')}>View</button>
                </div>
                <div className="alert alert-amber">
                  <i className="ti ti-clock" style={{ color: 'var(--amber)', fontSize: '15px', flexShrink: 0, marginTop: '1px' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--amber)' }}>Approval pending</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>RFQ-042 · 18h of 24h SLA elapsed</div>
                  </div>
                  <button className="btn btn-amber btn-xs" onClick={() => navigate('/rfqs')}>View</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Manager Dashboard
  const renderManager = () => {
    const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
    const approvedCount = approvals.filter(a => a.status === 'APPROVED').length || 8;
    const approvalValue = '₹5.8L';

    const recentApprovals = approvals.length ? approvals : [
      { id: '1', quotation: { rfq: { rfqNumber: 'RFQ-042' }, vendor: { name: 'InfraSupplies' }, totalAmount: 378780 }, priority: 'Urgent', status: 'PENDING' },
      { id: '2', quotation: { rfq: { rfqNumber: 'RFQ-041' }, vendor: { name: 'OfficeEssentials' }, totalAmount: 48200 }, priority: 'Normal', status: 'PENDING' }
    ];

    return (
      <div>
        <div className="kpi-grid">
          {kpiCard('ti-clock', 'var(--amber-light)', 'var(--amber)', 'var(--amber)', 'Pending Approvals', pendingApprovals.length || 2, '1 urgent — SLA 18h elapsed', 'var(--red)')}
          {kpiCard('ti-checks', 'var(--primary-light)', 'var(--primary)', 'var(--primary)', 'Approved This Month', approvedCount, '↑ 2 vs last month', 'var(--primary)')}
          {kpiCard('ti-currency-rupee', 'var(--blue-light)', 'var(--blue)', 'var(--blue)', 'Approval Value MTD', approvalValue, '4 POs generated', 'var(--text3)')}
          {kpiCard('ti-x', 'var(--red-light)', 'var(--red)', 'var(--red)', 'Rejections MTD', '1', 'Budget constraint', 'var(--text3)')}
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-head" style={{ background: 'var(--amber-light)' }}>
            <span className="card-title" style={{ color: 'var(--amber)' }}>Approval Queue</span>
            <span className="nav-badge" style={{ borderRadius: '10px', padding: '2px 8px' }}>
              {pendingApprovals.length || 2}
            </span>
          </div>
          <table>
            <thead>
              <tr><th>RFQ</th><th>Recommended Vendor</th><th>Amount</th><th>Priority</th><th>SLA</th><th>Action</th></tr>
            </thead>
            <tbody>
              {recentApprovals.map((a, i) => (
                <tr key={a.id}>
                  <td><div style={{ fontWeight: 600 }}>{a.quotation?.rfq?.rfqNumber || `RFQ-${i+41}`}</div></td>
                  <td>{a.quotation?.vendor?.name || 'InfraSupplies'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--amber)' }}>₹{(a.quotation?.totalAmount || 378780).toLocaleString('en-IN')}</td>
                  <td>{badgeHtml(a.priority || 'Urgent')}</td>
                  <td style={{ fontSize: '11px', color: a.priority === 'Urgent' ? 'var(--red)' : 'var(--text3)' }}>
                    {a.priority === 'Urgent' ? '18h / 24h' : '4h / 48h'}
                  </td>
                  <td>
                    {a.status === 'PENDING' || a.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-primary btn-xs" onClick={() => handleQuickApprove(a.id, i)}>
                          <i className="ti ti-check"></i> Approve
                        </button>
                        <button className="btn btn-outline btn-xs" style={{ color: 'var(--red)' }} onClick={() => handleQuickReject(a.id, i)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--primary)' }}>✓ {a.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="split-3">
          <div>
            <div className="card">
              <div className="card-head"><span className="card-title">Approval Timeline</span></div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  ['RFQ-042', 'InfraSupplies', '₹3,78,780', 'Pending', 'var(--amber)'],
                  ['RFQ-041', 'OfficeEssentials', '₹48,200', 'Pending', 'var(--amber)'],
                  ['RFQ-040', 'TechCorp', '₹1,24,500', 'Approved', 'var(--primary)'],
                  ['RFQ-039', 'FurniMax', '₹88,000', 'Approved', 'var(--primary)']
                ].map(([id, v, amt, st, c]) => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{id}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{v} · {amt}</div>
                    </div>
                    {badgeHtml(st)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="card">
              <div className="card-head"><span className="card-title">Procurement Funnel</span></div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['RFQ → Quotation', 9, 12, 'var(--primary)'],
                  ['Quotation → Approval', 5, 9, 'var(--amber)'],
                  ['Approval → PO', 4, 4, 'var(--primary)']
                ].map(([l, v, t, c]) => (
                  <div key={l}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{l}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: c }}>{v}/{t}</span>
                    </div>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width: `${Math.round((v / t) * 100)}%`, background: c }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. Vendor Dashboard
  const renderVendor = () => {
    const activeRfqCount = rfqs.length || 3;
    const submittedCount = 1;
    const activePoCount = pos.filter(p => p.status === 'ISSUED').length || 2;

    return (
      <div>
        <div className="kpi-grid">
          {kpiCard('ti-receipt', 'var(--blue-light)', 'var(--blue)', 'var(--blue)', 'Open RFQs for Me', activeRfqCount, '2 awaiting quote', 'var(--text3)')}
          {kpiCard('ti-send', 'var(--primary-light)', 'var(--primary)', 'var(--primary)', 'Quotes Submitted', submittedCount, 'RFQ-042 · submitted', 'var(--primary)')}
          {kpiCard('ti-package', 'var(--amber-light)', 'var(--amber)', 'var(--amber)', 'Active POs', activePoCount, '₹5.0L total value', 'var(--text3)')}
          {kpiCard('ti-checks', 'var(--primary-light)', 'var(--primary)', 'var(--primary)', 'Deliveries Due', '1', '27 Jun 2026', 'var(--text3)')}
        </div>

        <div className="split-3">
          <div>
            <div className="card">
              <div className="card-head"><span className="card-title">Open RFQs — Action Required</span></div>
              <table>
                <thead>
                  <tr><th>RFQ</th><th>Category</th><th>Deadline</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><div style={{ fontWeight: 600 }}>RFQ-042</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Office Furniture Q2</div></td>
                    <td>Furniture</td>
                    <td>18 Jun 2026</td>
                    <td>{badgeHtml('Active')}</td>
                    <td><button className="btn btn-primary btn-xs" onClick={() => navigate('/quotations')}>Submit Quote</button></td>
                  </tr>
                  <tr>
                    <td><div style={{ fontWeight: 600 }}>RFQ-041</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Stationery Supplies</div></td>
                    <td>Stationery</td>
                    <td>10 Jun 2026</td>
                    <td>{badgeHtml('Pending')}</td>
                    <td><button className="btn btn-outline btn-xs" onClick={() => navigate('/quotations')}>View RFQ</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-head"><span className="card-title">My Purchase Orders</span></div>
              <table>
                <thead>
                  <tr><th>PO Number</th><th>Amount</th><th>Delivery Due</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>PO-2129-2026</td>
                    <td>₹3,78,780</td>
                    <td style={{ color: 'var(--amber)' }}>27 Jun 2026</td>
                    <td>{badgeHtml('Active')}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>PO-2127-2026</td>
                    <td>₹88,000</td>
                    <td>10 May 2026</td>
                    <td>{badgeHtml('Paid')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 4. Admin Dashboard
  const renderAdmin = () => {
    return (
      <div>
        <div className="kpi-grid">
          {kpiCard('ti-building-store', 'var(--blue-light)', 'var(--blue)', 'var(--blue)', 'Total Vendors', vendors.length || 28, '3 pending approval', 'var(--amber)')}
          {kpiCard('ti-users', 'var(--primary-light)', 'var(--primary)', 'var(--primary)', 'Active Users', '12', '4 roles in use', 'var(--text3)')}
          {kpiCard('ti-currency-rupee', 'var(--purple-light)', 'var(--purple)', 'var(--purple)', 'YTD Procurement', '₹12.4L', 'vs ₹20L budget', 'var(--text3)')}
          {kpiCard('ti-alert-triangle', 'var(--amber-light)', 'var(--amber)', 'var(--amber)', 'Vendors Pending', '3', 'Require review', 'var(--red)')}
        </div>

        <div className="split-3">
          <div>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Vendor Status Overview</span>
                <div className="card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/vendors')}>Manage →</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Vendor</th><th>Category</th><th>Rating</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(vendors.length ? vendors.slice(0, 5) : [
                    { id: 1, name: 'InfraSupplies Pvt Ltd', category: { name: 'IT Hardware' }, rating: 4.1, status: 'ACTIVE' },
                    { id: 2, name: 'TechCorp Ltd', category: { name: 'IT Hardware' }, rating: 4.8, status: 'ACTIVE' },
                    { id: 3, name: 'OfficeEssentials Co.', category: { name: 'Stationery' }, rating: 3.2, status: 'PENDING' },
                    { id: 4, name: 'FurniMax Solutions', category: { name: 'Furniture' }, rating: 4.3, status: 'ACTIVE' }
                  ]).map(v => (
                    <tr key={v.id}>
                      <td><div style={{ fontWeight: 600 }}>{v.name}</div></td>
                      <td>{v.category?.name || 'Unassigned'}</td>
                      <td>{starRating(v.rating)}</td>
                      <td>{badgeHtml(v.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: '14px' }}>
              <div className="card-head">
                <span className="card-title">Spend by Category</span>
                <div className="card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>Full report →</button>
                </div>
              </div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['IT Hardware', 74, 4.61, 'var(--blue)'],
                  ['Furniture', 52, 3.21, 'var(--primary)'],
                  ['Stationery', 35, 2.14, 'var(--purple)'],
                  ['Logistics', 23, 1.45, 'var(--amber)']
                ].map(([cat, pct, amt, c]) => (
                  <div className="spend-row" key={cat}>
                    <div className="spend-label">{cat}</div>
                    <div className="spend-bar-bg">
                      <div className="spend-bar-fill" style={{ width: `${pct}%`, background: c }}></div>
                    </div>
                    <div className="spend-amount" style={{ color: c }}>₹{amt}L</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '10px' }}>
        <i className="ti ti-loader animate-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
        <p style={{ color: 'var(--text2)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (role === 'PROCUREMENT_OFFICER') return renderProcurementOfficer();
  if (role === 'MANAGER') return renderManager();
  if (role === 'VENDOR') return renderVendor();
  if (role === 'ADMIN') return renderAdmin();

  return renderProcurementOfficer();
}
