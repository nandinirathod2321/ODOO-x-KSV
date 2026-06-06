import { useEffect, useState } from 'react';
import { getActivityLogs } from '../services/activity.service.js';
import toast from 'react-hot-toast';

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setLogs([
        { type: 'RFQs', dot: 'green', icon: '✓', title: 'RFQ-042 Created', meta: 'Riya Sharma · Procurement Officer · 03 Jun 2026', body: 'RFQ-042 issued for Office Furniture Procurement Q2. 3 vendors: FurniMax, InfraSupplies, OfficeEssentials.' },
        { type: 'RFQs', dot: 'green', icon: '✓', title: 'RFQ-041 Issued', meta: 'Riya Sharma · 02 Jun 2026', body: 'RFQ-041 for Stationery supplies issued to 2 vendors. Deadline: 10 Jun 2026.' },
        { type: 'Approvals', dot: 'amber', icon: '⏳', title: 'Approval Pending — RFQ-042', meta: 'Mgr. Vikram Patel · Awaiting review · SLA: 24h', body: 'Forwarded by Riya Sharma on 06 Jun. Best quote: InfraSupplies ₹3,78,780.' },
        { type: 'Approvals', dot: 'green', icon: '✓', title: 'PO-2128 Approved', meta: 'Mgr. Patel · 15 May 2026', body: 'TechCorp Ltd PO approved and generated. ₹1,24,500.' },
        { type: 'Invoiced', dot: 'amber', icon: '🧾', title: 'INV-0082 Generated & Emailed', meta: 'Riya Sharma · 06 Jun 2026', body: 'Invoice for ₹3,79,071 emailed to infra@supplies.com. Due: 06 Jul 2026.' },
        { type: 'Invoiced', dot: 'green', icon: '✓', title: 'INV-0080 Marked Paid', meta: 'Finance · 12 May 2026', body: 'FurniMax invoice ₹1,03,840 confirmed paid via NEFT.' },
        { type: 'Vendors', dot: 'blue', icon: 'ℹ', title: 'TechCorp Ltd Added', meta: 'Admin · 01 Jun 2026', body: 'New vendor registered: IT Hardware category. Pending approval.' },
        { type: 'Vendors', dot: 'green', icon: '✓', title: 'OfficeEssentials Approved', meta: 'Admin · 20 May 2026', body: 'Vendor profile approved after document verification.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getFilteredLogs = () => {
    if (activeFilter === 'All') return logs;
    return logs.filter(log => {
      // Map API event types to category filters
      const type = log.type || (log.eventType?.toLowerCase().includes('rfq') ? 'RFQs' :
                    log.eventType?.toLowerCase().includes('approval') ? 'Approvals' :
                    log.eventType?.toLowerCase().includes('invoice') ? 'Invoiced' :
                    log.eventType?.toLowerCase().includes('vendor') ? 'Vendors' : 'Other');
      return type === activeFilter;
    });
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', textAlign: 'left' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Activity & Logs</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Full procurement audit trail</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div className="chip-row">
            {['All', 'RFQs', 'Approvals', 'Invoiced', 'Vendors'].map(f => (
              <div
                key={f}
                className={`chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : (
        <div className="split-3">
          <div>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Audit Timeline</span>
                <div className="card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => toast.success('Activity report downloaded')}>
                    <i className="ti ti-download"></i> Export
                  </button>
                </div>
              </div>
              <div className="tl-wrap" style={{ padding: '16px' }}>
                {filteredLogs.length === 0 ? (
                  <p style={{ color: 'var(--text3)', textAlign: 'center' }}>No activities found for this filter.</p>
                ) : (
                  filteredLogs.map((a, idx) => {
                    const dotClass = a.dot || (a.eventType?.toLowerCase().includes('create') ? 'green' : 'blue');
                    const iconStr = a.icon || '✓';
                    return (
                      <div className="tl-item" key={idx}>
                        <div style={{ display: 'flex', flexSpans: 'column', alignItems: 'center', flexDirection: 'column' }}>
                          <div className={`tl-dot ${dotClass}`}>{iconStr}</div>
                          {idx < filteredLogs.length - 1 && <div className="tl-vline"></div>}
                        </div>
                        <div className="tl-right" style={{ paddingBottom: idx < filteredLogs.length - 1 ? '14px' : '0' }}>
                          <div className="tl-title">{a.title || a.eventType || 'Event'}</div>
                          <div className="tl-meta">{a.meta || new Date(a.createdAt).toLocaleString()}</div>
                          <div className="tl-body">{a.body || a.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: '12px' }}>
              <div className="card-head">
                <span className="card-title">System Alerts</span>
                <span className="nav-badge" style={{ borderRadius: '10px', padding: '2px 8px' }}>3</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="alert alert-red">
                  <i className="ti ti-alert-circle" style={{ color: 'var(--red)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)' }}>Invoice Overdue</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>INV-0081 · TechCorp · ₹1,46,910 unpaid</div>
                  </div>
                  <button className="btn btn-danger btn-xs" style={{ flexShrink: 0 }} onClick={() => toast.success('Reminder email dispatched')}>Remind</button>
                </div>
                <div className="alert alert-amber">
                  <i className="ti ti-clock" style={{ color: 'var(--amber)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)' }}>RFQ Deadline Soon</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>RFQ-041 · Stationery · 10 Jun 2026</div>
                  </div>
                </div>
                <div className="alert alert-amber">
                  <i className="ti ti-alert-triangle" style={{ color: 'var(--amber)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)' }}>Approval SLA Warning</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>RFQ-041 · 18h of 24h elapsed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><span className="card-title">Recent Actions</span></div>
              <table>
                <thead>
                  <tr><th>Action</th><th>By</th><th>Time</th></tr>
                </thead>
                <tbody>
                  <tr><td>INV-0082 emailed</td><td>Riya S.</td><td style={{ color: 'var(--text3)' }}>10 min</td></tr>
                  <tr><td>PO-2129 generated</td><td>System</td><td style={{ color: 'var(--text3)' }}>1h ago</td></tr>
                  <tr><td>RFQ-042 approved</td><td>Mgr. Patel</td><td style={{ color: 'var(--text3)' }}>2h ago</td></tr>
                  <tr><td>Quote: InfraSupplies</td><td>Vendor</td><td style={{ color: 'var(--text3)' }}>5h ago</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
