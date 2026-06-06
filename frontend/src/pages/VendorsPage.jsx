import { useEffect, useState } from 'react';
import { getVendors, createVendor } from '../services/vendor.service.js';
import toast from 'react-hot-toast';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New vendor form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [category, setCategory] = useState('IT Hardware');
  const [address, setAddress] = useState('');

  const fetchVendorsList = async () => {
    try {
      setLoading(true);
      const data = await getVendors();
      setVendors(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setVendors([
        { id: 1, name: 'InfraSupplies Pvt Ltd', email: 'infra@supplies.com', phone: '+91 98765 43210', gstNumber: '29AABCI1234J1Z5', category: { name: 'IT Hardware' }, rating: 4.1, status: 'ACTIVE' },
        { id: 2, name: 'TechCorp Ltd', email: 'vendor@techcorp.in', phone: '+91 90123 45678', gstNumber: '27AABCT5678K1Z2', category: { name: 'IT Hardware' }, rating: 4.8, status: 'ACTIVE' },
        { id: 3, name: 'OfficeEssentials Co.', email: 'sales@officeess.com', phone: '+91 70987 65432', gstNumber: '06AABCO9012L1Z8', category: { name: 'Stationery' }, rating: 3.2, status: 'PENDING' },
        { id: 4, name: 'FurniMax Solutions', email: 'info@furnimax.com', phone: '+91 81234 56789', gstNumber: '33AABCF3456M1Z1', category: { name: 'Furniture' }, rating: 4.3, status: 'ACTIVE' },
        { id: 5, name: 'QuickLogix Transport', email: 'ops@quicklogix.com', phone: '+91 77654 32109', gstNumber: '21AABCQ7890N1Z6', category: { name: 'Logistics' }, rating: 2.1, status: 'BLOCKED' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsList();

    const handleAddVendorCta = () => {
      setShowModal(true);
    };
    window.addEventListener('topbar-cta-clicked', handleAddVendorCta);
    return () => window.removeEventListener('topbar-cta-clicked', handleAddVendorCta);
  }, []);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await createVendor({ name, email, phone, gstNumber, categoryName: category, address });
      toast.success('Vendor added successfully');
      setShowModal(false);
      fetchVendorsList();
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setGstNumber('');
      setAddress('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor');
    }
  };

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
      PENDING: 'amber',
      Pending: 'amber',
      BLOCKED: 'red',
      Blocked: 'red'
    };
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          (v.category?.name || '').toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'All') return matchesSearch;
    if (filter === 'Active') return matchesSearch && v.status === 'ACTIVE';
    if (filter === 'Pending') return matchesSearch && v.status === 'PENDING';
    if (filter === 'Blocked') return matchesSearch && v.status === 'BLOCKED';
    return matchesSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div className="chip-row">
          {['All', 'Active', 'Pending', 'Blocked'].map(f => (
            <div
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>
        
        <div className="search-wrap" style={{ maxWidth: '280px', marginLeft: 'auto' }}>
          <i className="ti ti-search search-icon"></i>
          <input
            type="text"
            className="form-input"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Vendor Registry</span>
            <span className="card-sub">{filteredVendors.length} vendors listed</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Info</th>
                <th>GSTIN</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>ID: {v.id}</div>
                  </td>
                  <td>
                    <div>{v.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{v.phone || 'N/A'}</div>
                  </td>
                  <td><code style={{ fontSize: '11px' }}>{v.gstNumber || 'N/A'}</code></td>
                  <td>{v.category?.name || 'Uncategorized'}</td>
                  <td>{starRating(v.rating)}</td>
                  <td>{badgeHtml(v.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Register New Vendor</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleCreateVendor}>
              <div className="modal-body">
                <div className="form-grid" style={{ padding: 0 }}>
                  <div className="form-group form-full">
                    <label className="form-label">Vendor Name *</label>
                    <input className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Supplies Pvt Ltd" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input className="form-input" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. info@acme.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 99999 88888" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN / Tax ID</label>
                    <input className="form-input" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="e.g. 29AABCA1234J1Z5" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                      <option>IT Hardware</option>
                      <option>Furniture</option>
                      <option>Stationery</option>
                      <option>Logistics</option>
                    </select>
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">Address</label>
                    <textarea className="form-input" rows="2" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full office address..."></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
