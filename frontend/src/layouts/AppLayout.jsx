import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import { ROLES } from '../utils/config/constants.js';
import { useEffect, useState } from 'react';

const ROLE_NAV = {
  PROCUREMENT_OFFICER: [
    { path: '/', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { path: '/vendors', icon: 'ti-building-store', label: 'Vendors' },
    { path: '/rfqs', icon: 'ti-file-description', label: 'RFQs', badge: 'green', badgeVal: '3' },
    { path: '/quotations', icon: 'ti-receipt', label: 'Quotations' },
    { path: '/comparison', icon: 'ti-table', label: 'Comparison' },
    { path: '/pos', icon: 'ti-package', label: 'Purchase Orders' },
    { path: '/invoices', icon: 'ti-file-invoice', label: 'Invoices' },
    { path: '/activity', icon: 'ti-timeline', label: 'Activity' },
  ],
  MANAGER: [
    { path: '/', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { path: '/approvals', icon: 'ti-checks', label: 'Approvals', badge: 'red', badgeVal: '2' },
    { path: '/rfqs', icon: 'ti-file-description', label: 'RFQs' },
    { path: '/pos', icon: 'ti-package', label: 'Purchase Orders' },
    { path: '/reports', icon: 'ti-chart-bar', label: 'Reports' },
    { path: '/activity', icon: 'ti-timeline', label: 'Activity' },
  ],
  VENDOR: [
    { path: '/', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { path: '/quotations', icon: 'ti-receipt', label: 'Submit Quotation' },
    { path: '/rfqs', icon: 'ti-file-description', label: 'Open RFQs' },
    { path: '/pos', icon: 'ti-package', label: 'My Purchase Orders' },
  ],
  ADMIN: [
    { path: '/', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { path: '/vendors', icon: 'ti-building-store', label: 'Vendor Management' },
    { path: '/reports', icon: 'ti-chart-bar', label: 'Analytics' },
    { path: '/activity', icon: 'ti-timeline', label: 'Audit Log' },
  ]
};

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/vendors': 'Vendor Management',
  '/rfqs': 'RFQs Procurement',
  '/quotations': 'Quotations',
  '/comparison': 'Quotation Comparison',
  '/approvals': 'Approval Queue',
  '/pos': 'Purchase Orders',
  '/invoices': 'Invoices & Billing',
  '/reports': 'Reports & Analytics',
  '/activity': 'Activity & Audit Log'
};

const ROLE_TOPBAR_CTA = {
  PROCUREMENT_OFFICER: { '/': 'New RFQ', '/vendors': 'Add Vendor', '/rfqs': 'New RFQ', '/comparison': 'Send for Approval' },
  MANAGER: { '/reports': 'Export' },
  VENDOR: { '/quotations': 'Submit Quote' },
  ADMIN: { '/vendors': 'Add Vendor', '/reports': 'Export' }
};

export default function AppLayout() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const role = useAuthStore(state => state.role) || 'PROCUREMENT_OFFICER';
  const location = useLocation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = ROLE_NAV[role] || ROLE_NAV.PROCUREMENT_OFFICER;
  const currentPath = location.pathname;

  const getPageTitle = () => {
    if (role === 'VENDOR') {
      if (currentPath === '/rfqs') return 'Open RFQs';
      if (currentPath === '/quotations') return 'Submit Quotation';
      if (currentPath === '/pos') return 'My Purchase Orders';
    }
    return PAGE_TITLES[currentPath] || 'VendorBridge';
  };

  const ctaMap = ROLE_TOPBAR_CTA[role] || {};
  const ctaLabel = ctaMap[currentPath];

  const handleCtaClick = () => {
    window.dispatchEvent(new CustomEvent('topbar-cta-clicked', { detail: { path: currentPath } }));
  };

  const getAvatarInitials = () => {
    if (!user || !user.name) return 'US';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayRole = () => {
    const rolesMap = {
      ADMIN: 'Admin',
      MANAGER: 'Manager / Approver',
      PROCUREMENT_OFFICER: 'Procurement Officer',
      VENDOR: 'Vendor'
    };
    return rolesMap[role] || role;
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-wrap">
          <div className="logo-brand">VendorBridge</div>
          <div className="logo-tag">Procurement ERP · v2.0</div>
        </div>

        <div className="nav-section">
          {navItems.map(item => {
            const isActive = currentPath === item.path;
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <i className={`ti ${item.icon} nav-icon`}></i>
                {item.label}
                {item.badge !== undefined && (
                  <span className={`nav-badge ${item.badge === 'green' ? 'green' : ''}`}>
                    {item.badgeVal}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{getAvatarInitials()}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="sb-name">{user?.name || 'User'}</div>
              <div className="sb-role">{getDisplayRole()}</div>
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ width: '100%', marginTop: '10px', fontSize: '11px', justifyContent: 'center' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content panel */}
      <div className="main">
        <div className="topbar">
          <div>
            <div className="tb-title">{getPageTitle()}</div>
          </div>
          <div className="tb-spacer"></div>
          <span className="tb-time">{timeStr}</span>
          {ctaLabel && (
            <button className="btn btn-primary btn-sm" onClick={handleCtaClick}>
              <i className="ti ti-plus"></i> {ctaLabel}
            </button>
          )}
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
