import { useEffect, useState } from 'react';
import { getRfqs, createRfq, publishRfq, closeRfq } from '../services/rfq.service.js';
import { getVendors } from '../services/vendor.service.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

export default function RfqsPage() {
  const role = useAuthStore(state => state.role);
  const [rfqsList, setRfqsList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'create'

  // Stepper state
  const [rfqStep, setRfqStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default to 7 days in future
    return d.toISOString().split('T')[0];
  });
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default to 14 days in future
    return d.toISOString().split('T')[0];
  });
  const [rfqItems, setRfqItems] = useState([
    { id: 1, description: 'Ergonomic Chair (High-Back)', unit: 'Nos', quantity: 20, notes: 'ISO certified' },
    { id: 2, description: 'Height-Adj. Workstation', unit: 'Nos', quantity: 10, notes: 'With cable mgmt' }
  ]);
  const [assignedVendors, setAssignedVendors] = useState({});

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const data = await getRfqs();
      setRfqsList(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setRfqsList([
        { id: '1', rfqNumber: 'RFQ-042', title: 'Office Furniture Procurement Q2', description: 'Procuring high back chairs and meeting tables', deadline: '2026-06-18', status: 'PUBLISHED', createdAt: '2026-06-03' },
        { id: '2', rfqNumber: 'RFQ-041', title: 'Stationery Supplies', description: 'Bulk order for paper and pens', deadline: '2026-06-10', status: 'DRAFT', createdAt: '2026-06-02' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();

    const fetchVendorOptions = async () => {
      try {
        const vData = await getVendors();
        setVendors(vData);
        // Pre-select first vendor
        if (vData.length > 0) {
          setAssignedVendors({ [vData[0].id]: true });
        }
      } catch (err) {
        console.error(err);
        setVendors([
          { id: 'v1', name: 'InfraSupplies Pvt Ltd', cat: 'IT Hardware', rating: 4.1, status: 'Active' },
          { id: 'v2', name: 'TechCorp Ltd', cat: 'IT Hardware', rating: 4.8, status: 'Active' },
          { id: 'v3', name: 'FurniMax Solutions', cat: 'Furniture', rating: 4.3, status: 'Active' }
        ]);
      }
    };
    fetchVendorOptions();

    const handleCreateCta = () => {
      setView('create');
      setRfqStep(1);
    };
    window.addEventListener('topbar-cta-clicked', handleCreateCta);
    return () => window.removeEventListener('topbar-cta-clicked', handleCreateCta);
  }, []);

  const handlePublish = async (id) => {
    try {
      await publishRfq(id);
      toast.success('RFQ published to vendors');
      fetchRfqs();
    } catch (err) {
      toast.error('Failed to publish RFQ');
    }
  };

  const handleClose = async (id) => {
    try {
      await closeRfq(id);
      toast.success('RFQ closed successfully');
      fetchRfqs();
    } catch (err) {
      toast.error('Failed to close RFQ');
    }
  };

  // RFQ Creation step actions
  const addRfqItemRow = () => {
    setRfqItems(prev => [...prev, { id: Date.now(), description: 'New Item', unit: 'Nos', quantity: 1, notes: '' }]);
    toast.success('Item row added');
  };

  const removeRfqItemRow = (id) => {
    if (rfqItems.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setRfqItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemField = (id, field, value) => {
    setRfqItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleVendorSelection = (vendorId) => {
    setAssignedVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleSubmitRfq = async () => {
    const vendorIds = Object.keys(assignedVendors).filter(key => assignedVendors[key]);
    if (vendorIds.length === 0) {
      toast.error('Please assign at least one vendor');
      return;
    }

    const payload = {
      title,
      description,
      deadline: new Date(deadline).toISOString(),
      items: rfqItems.map(it => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit,
        notes: it.notes
      })),
      vendorIds
    };

    try {
      await createRfq(payload);
      toast.success('RFQ Created Successfully!');
      setView('list');
      fetchRfqs();
      // Reset state
      setTitle('');
      setDescription('');
      setRfqStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit RFQ');
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
      DRAFT: 'gray',
      PUBLISHED: 'green',
      QUOTATION_RECEIVED: 'blue',
      AWARDED: 'purple',
      CLOSED: 'red',
      CANCELLED: 'red'
    };
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
  };

  // Render list view
  const renderList = () => (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Procurement Requests (RFQs)</span>
        <div className="card-actions">
          {role !== 'VENDOR' && (
            <button className="btn btn-primary btn-sm" onClick={() => setView('create')}>
              <i className="ti ti-plus"></i> Create RFQ
            </button>
          )}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>RFQ ID</th>
            <th>Title</th>
            <th>Submission Deadline</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rfqsList.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No RFQs found</td>
            </tr>
          ) : (
            rfqsList.map(rfq => (
              <tr key={rfq.id}>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{rfq.rfqNumber}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{rfq.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{rfq.description || 'No description'}</div>
                </td>
                <td>{new Date(rfq.deadline).toLocaleDateString('en-GB')}</td>
                <td>{badgeHtml(rfq.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {role !== 'VENDOR' && rfq.status === 'DRAFT' && (
                      <button className="btn btn-primary btn-xs" onClick={() => handlePublish(rfq.id)}>
                        <i className="ti ti-send"></i> Publish
                      </button>
                    )}
                    {role !== 'VENDOR' && rfq.status === 'PUBLISHED' && (
                      <button className="btn btn-outline btn-xs" style={{ color: 'var(--red)' }} onClick={() => handleClose(rfq.id)}>
                        <i className="ti ti-lock"></i> Close
                      </button>
                    )}
                    <button className="btn btn-ghost btn-xs" onClick={() => toast.info(`Viewing items for ${rfq.rfqNumber}`)}>
                      Items ({rfq.items?.length || 0})
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Render stepper view
  const renderStepper = () => {
    const stepperHtml = (
      <div className="stepper">
        <div className="step-item">
          <div className={`step-circle ${rfqStep >= 1 ? rfqStep === 1 ? 'active' : 'done' : ''}`} onClick={() => setRfqStep(1)}>
            {rfqStep > 1 ? '✓' : '1'}
          </div>
          <span className={`step-label ${rfqStep === 1 ? 'active' : ''}`}>RFQ Details</span>
        </div>
        <div className={`step-line ${rfqStep > 1 ? 'done' : ''}`}></div>
        <div className="step-item">
          <div className={`step-circle ${rfqStep >= 2 ? rfqStep === 2 ? 'active' : 'done' : ''}`} onClick={() => setRfqStep(2)}>
            {rfqStep > 2 ? '✓' : '2'}
          </div>
          <span className={`step-label ${rfqStep === 2 ? 'active' : ''}`}>Add Items</span>
        </div>
        <div className={`step-line ${rfqStep > 2 ? 'done' : ''}`}></div>
        <div className="step-item">
          <div className={`step-circle ${rfqStep === 3 ? 'active' : ''}`} onClick={() => setRfqStep(3)}>3</div>
          <span className={`step-label ${rfqStep === 3 ? 'active' : ''}`}>Assign Vendors</span>
        </div>
      </div>
    );

    let stepContent = null;

    if (rfqStep === 1) {
      stepContent = (
        <div className="split">
          <div className="card">
            <div className="card-head"><span className="card-title">Step 1 — RFQ Details</span></div>
            <div className="form-grid">
              <div className="form-group form-full">
                <label className="form-label">RFQ Title *</label>
                <input className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Office Furniture Procurement Q2" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input">
                  <option>Furniture</option>
                  <option>IT Hardware</option>
                  <option>Stationery</option>
                  <option>Logistics</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Submission Deadline *</label>
                <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Expected By</label>
                <input className="form-input" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
              <div className="form-group form-full">
                <label className="form-label">Description / Scope</label>
                <textarea className="form-input" rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide specifications or project scope..."></textarea>
              </div>
            </div>
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-outline" onClick={() => setView('list')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                if (!title) { toast.error('RFQ Title is required'); return; }
                setRfqStep(2);
              }}>
                Next: Add Items <i className="ti ti-arrow-right"></i>
              </button>
            </div>
          </div>
          <div className="card" style={{ height: 'fit-content', padding: '16px' }}>
            <span className="card-title">RFQ Summary</span>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text3)' }}>Title:</span><span style={{ fontWeight: 600 }}>{title || 'Untitled'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text3)' }}>Deadline:</span><span style={{ fontWeight: 600 }}>{deadline}</span></div>
            </div>
          </div>
        </div>
      );
    } else if (rfqStep === 2) {
      stepContent = (
        <div className="split">
          <div className="card">
            <div className="card-head">
              <span className="card-title">Step 2 — Item List</span>
              <div className="card-actions">
                <button className="btn btn-primary btn-sm" onClick={addRfqItemRow}><i className="ti ti-plus"></i> Add Item</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Item / Service *</th>
                  <th style={{ width: '70px' }}>Unit</th>
                  <th style={{ width: '60px' }}>Qty</th>
                  <th>Notes</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rfqItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <input className="form-input" required value={item.description} onChange={e => updateItemField(item.id, 'description', e.target.value)} />
                    </td>
                    <td>
                      <input className="form-input" value={item.unit} onChange={e => updateItemField(item.id, 'unit', e.target.value)} />
                    </td>
                    <td>
                      <input className="form-input" type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', Number(e.target.value))} />
                    </td>
                    <td>
                      <input className="form-input" value={item.notes} onChange={e => updateItemField(item.id, 'notes', e.target.value)} placeholder="Spec details..." />
                    </td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-icon btn-xs" style={{ color: 'var(--red)' }} onClick={() => removeRfqItemRow(item.id)}>
                        <i className="ti ti-x"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-outline" onClick={() => setRfqStep(1)}><i className="ti ti-arrow-left"></i> Back</button>
              <button className="btn btn-primary" onClick={() => setRfqStep(3)}>Next: Assign Vendors <i className="ti ti-arrow-right"></i></button>
            </div>
          </div>
          <div className="card" style={{ height: 'fit-content', padding: '16px' }}>
            <span className="card-title">Items Overview</span>
            <div style={{ marginTop: '10px', color: 'var(--text2)' }}>
              {rfqItems.length} line items defined.
            </div>
          </div>
        </div>
      );
    } else {
      stepContent = (
        <div className="split">
          <div className="card">
            <div className="card-head">
              <span className="card-title">Step 3 — Assign Vendors</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {vendors.length === 0 ? (
                <p style={{ color: 'var(--text3)' }}>No active vendors registered.</p>
              ) : (
                vendors.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }}>
                    <input
                      type="checkbox"
                      checked={!!assignedVendors[v.id]}
                      onChange={() => toggleVendorSelection(v.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{v.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {v.category?.name || 'Unassigned'} · {starRating(v.rating)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setRfqStep(2)}><i className="ti ti-arrow-left"></i> Back</button>
              <button className="btn btn-primary" onClick={handleSubmitRfq}>
                <i className="ti ti-send"></i> Submit & Publish RFQ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {stepperHtml}
        {stepContent}
      </div>
    );
  };

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
        </div>
      ) : view === 'create' ? (
        renderStepper()
      ) : (
        renderList()
      )}
    </div>
  );
}
