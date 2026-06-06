import { useEffect, useState } from 'react';
import { getSpendingSummary, getMonthlyTrends, getProcurementStats } from '../services/reports.service.js';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('Jun 2026');

  // Backend stats states
  const [spend, setSpend] = useState('₹12.4L');
  const [activeVendors, setActiveVendors] = useState(28);
  const [onTimeDelivery, setOnTimeDelivery] = useState('94%');
  const [monthlyPOs, setMonthlyPOs] = useState(3);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [summary, trends, stats] = await Promise.allSettled([
        getSpendingSummary(),
        getMonthlyTrends(),
        getProcurementStats()
      ]);
      // If backend works, update states. Else fall back to mock structure.
      if (stats.status === 'fulfilled' && stats.value) {
        setSpend(`₹${(stats.value.ytdSpend || 1240000 / 100000).toFixed(1)}L`);
        setActiveVendors(stats.value.activeVendorsCount || 28);
        setOnTimeDelivery(`${stats.value.onTimeDeliveryRate || 94}%`);
        setMonthlyPOs(stats.value.monthlyPoCount || 3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleExport = () => {
      toast.success('Generating report — download will start shortly');
      setTimeout(() => toast.success('Report exported as VendorBridge_Jun2026.xlsx'), 1500);
    };
    window.addEventListener('topbar-cta-clicked', handleExport);
    return () => window.removeEventListener('topbar-cta-clicked', handleExport);
  }, []);

  const kpiCard = (icon, iconBg, iconColor, accent, label, val, delta) => (
    <div className="kpi-card" key={label}>
      <div className="kpi-accent" style={{ background: accent }}></div>
      <div className="kpi-icon" style={{ background: iconBg, color: iconColor }}>
        <i className={`ti ${icon}`}></i>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{ color: iconColor }}>{val}</div>
      <div className="kpi-delta" style={{ color: 'var(--primary)' }}>{delta}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', textAlign: 'left' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Reports & Analytics</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Procurement Insights · {activeRange}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <div className="chip-row">
            {['May 2026', 'Jun 2026', 'Q2 2026', 'YTD'].map(m => (
              <div
                key={m}
                className={`chip ${activeRange === m ? 'active' : ''}`}
                onClick={() => {
                  setActiveRange(m);
                  toast.success(`Date range filter changed to ${m}`);
                }}
              >
                {m}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => {
            toast.success('Generating report — download will start shortly');
            setTimeout(() => toast.success('Report exported as VendorBridge_Jun2026.xlsx'), 1200);
          }}>
            <i className="ti ti-download"></i> Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : (
        <div>
          <div className="kpi-grid">
            {kpiCard('ti-currency-rupee', 'var(--primary-light)', 'var(--primary)', 'var(--primary)', 'Total Spend', spend, 'YTD 2026')}
            {kpiCard('ti-building-store', 'var(--blue-light)', 'var(--blue)', 'var(--blue)', 'Active Vendors', activeVendors, '+4 this quarter')}
            {kpiCard('ti-truck-delivery', 'var(--amber-light)', 'var(--amber)', 'var(--amber)', 'On-time Delivery', onTimeDelivery, '↑ 3% vs last month')}
            {kpiCard('ti-package', 'var(--purple-light)', 'var(--purple)', 'var(--purple)', 'Monthly POs', monthlyPOs, '₹5.1L value')}
          </div>

          <div className="split-3">
            <div>
              <div className="card">
                <div className="card-head"><span className="card-title">Spend by Category</span></div>
                <div style={{ padding: '16px' }}>
                  {[
                    ['IT Hardware', 74, 4.61, 'var(--blue)'],
                    ['Furniture', 52, 3.21, 'var(--primary)'],
                    ['Stationery', 35, 2.14, 'var(--purple)'],
                    ['Logistics', 23, 1.45, 'var(--amber)'],
                    ['Misc', 16, 0.99, 'var(--text3)']
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

              <div className="card" style={{ marginTop: '14px' }}>
                <div className="card-head"><span className="card-title">Procurement Overview</span></div>
                <table>
                  <thead>
                    <tr><th>Metric</th><th>Value</th><th>vs Last Month</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>RFQs Issued</td><td style={{ fontWeight: 600 }}>12</td><td style={{ color: 'var(--primary)' }}>↑ 3</td></tr>
                    <tr><td>Avg. Quote Time</td><td style={{ fontWeight: 600 }}>4.2 days</td><td style={{ color: 'var(--primary)' }}>↓ 0.8d</td></tr>
                    <tr><td>PO Cycle Time</td><td style={{ fontWeight: 600 }}>6.5 days</td><td style={{ color: 'var(--amber)' }}>→ same</td></tr>
                    <tr><td>Savings vs Budget</td><td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹1.6L</td><td style={{ color: 'var(--primary)' }}>↑ 8%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="card">
                <div className="card-head"><span className="card-title">Monthly Spend Trend</span></div>
                <div className="chart-wrap">
                  <div className="chart-bars" style={{ height: '110px' }}>
                    {[
                      ['Jan', 40, 1.6],
                      ['Feb', 60, 2.4],
                      ['Mar', 45, 1.8],
                      ['Apr', 75, 3.0],
                      ['May', 65, 2.6],
                      ['Jun', 85, 3.4]
                    ].map(([m, h, v]) => (
                      <div className="bar-col" key={m}>
                        <div className="bar-val">₹{v}L</div>
                        <div className={`bar-fill ${m === 'Jun' ? 'highlight' : ''}`} style={{ height: `${h}%` }}></div>
                        <div className="bar-label">{m}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: '14px' }}>
                <div className="card-head"><span className="card-title">Top Vendors by Spend</span></div>
                <table>
                  <thead>
                    <tr><th>Vendor</th><th>Spend</th><th>POs</th><th>Rating</th></tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ fontWeight: 600 }}>TechCorp Ltd</td><td style={{ color: 'var(--primary)' }}>₹4,20,000</td><td>4</td><td>4.8★</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>InfraSupplies</td><td style={{ color: 'var(--primary)' }}>₹3,20,000</td><td>3</td><td>4.1★</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>FurniMax</td><td style={{ color: 'var(--primary)' }}>₹1,30,000</td><td>2</td><td>4.3★</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>OfficeEssentials</td><td style={{ color: 'var(--primary)' }}>₹80,000</td><td>1</td><td>3.2★</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
