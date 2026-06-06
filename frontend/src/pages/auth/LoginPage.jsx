import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { login, registerUser } from '../../services/auth.service.js';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.string(),
  country: z.string().optional()
});

const ROLE_CREDS = {
  PROCUREMENT_OFFICER: { email: 'officer@vendorbridge.com', password: 'officer123', desc: 'Full access: RFQs, Quotations, POs, Invoices' },
  MANAGER: { email: 'manager@vendorbridge.com', password: 'manager123', desc: 'View & approve procurement requests' },
  VENDOR: { email: 'vendor@vendorbridge.com', password: 'vendor123', desc: 'Submit quotations and view your POs' },
  ADMIN: { email: 'admin@vendorbridge.com', password: 'admin123', desc: 'Full admin access: vendors, analytics, settings' }
};

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState('PROCUREMENT_OFFICER');

  const { register: registerLogin, handleSubmit: handleLoginSubmit, setValue: setLoginValue, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: ROLE_CREDS.PROCUREMENT_OFFICER.email,
      password: ROLE_CREDS.PROCUREMENT_OFFICER.password
    }
  });

  const { register: registerRegister, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors }, reset: resetRegister } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'PROCUREMENT_OFFICER'
    }
  });

  const setAuth = useAuthStore(state => state.login);
  const navigate = useNavigate();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back! Signed in as ${res.data.user.role}`);
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (res) => {
      // Backend registration returns: { user, token }
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome! Registered and logged in as ${res.data.user.role}`);
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setLoginValue('email', ROLE_CREDS[role].email);
    setLoginValue('password', ROLE_CREDS[role].password);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'linear-gradient(135deg,#f0fdf4 0%,#e0f2fe 100%)', minHeight: '560px' }}>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '36px', width: '380px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '22px', color: '#fff' }}>
            <i className="ti ti-building-store"></i>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>VendorBridge</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Procurement & Vendor Management ERP</div>
        </div>

        {/* Tab row */}
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '8px', padding: '3px', marginBottom: '20px' }}>
          <div
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: activeTab === 'login' ? '#fff' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              color: activeTab === 'login' ? 'var(--text)' : 'var(--text2)',
              boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Sign In
          </div>
          <div
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: activeTab === 'register' ? '#fff' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              color: activeTab === 'register' ? 'var(--text)' : 'var(--text2)',
              boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Register
          </div>
        </div>

        {activeTab === 'login' ? (
          /* Sign In Panel */
          <form onSubmit={handleLoginSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Email address</label>
              <input {...registerLogin('email')} className="form-input" type="email" placeholder="you@company.com" />
              {loginErrors.email && <p className="text-red-600 text-xs mt-1">{loginErrors.email.message}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Password</label>
              <input type="password" {...registerLogin('password')} className="form-input" placeholder="••••••••" />
              {loginErrors.password && <p className="text-red-600 text-xs mt-1">{loginErrors.password.message}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: '6px' }}>
              <label className="form-label">Sign in as</label>
              <select className="form-input" value={selectedRole} onChange={(e) => handleRoleChange(e.target.value)}>
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="MANAGER">Manager / Approver</option>
                <option value="VENDOR">Vendor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--blue)', background: 'var(--blue-light)', padding: '6px 10px', borderRadius: '6px', marginBottom: '14px', textAlign: 'left' }}>
              {ROLE_CREDS[selectedRole].desc}
            </div>

            <button type="submit" disabled={loginMutation.isPending} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '13px', justifyContent: 'center' }}>
              {loginMutation.isPending ? 'Signing In...' : 'Sign In to VendorBridge'}
            </button>
          </form>
        ) : (
          /* Register Panel */
          <form onSubmit={handleRegisterSubmit((d) => registerMutation.mutate(d))} className="space-y-3">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input {...registerRegister('name')} className="form-input" placeholder="e.g. John Doe" />
              {registerErrors.name && <p className="text-red-600 text-xs mt-1">{registerErrors.name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input {...registerRegister('email')} className="form-input" type="email" placeholder="e.g. john@corp.com" />
              {registerErrors.email && <p className="text-red-600 text-xs mt-1">{registerErrors.email.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" {...registerRegister('password')} className="form-input" placeholder="Min 6 characters" />
              {registerErrors.password && <p className="text-red-600 text-xs mt-1">{registerErrors.password.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input {...registerRegister('phone')} className="form-input" placeholder="e.g. +91 9876543210" />
            </div>

            <div className="form-group">
              <label className="form-label">Account Role *</label>
              <select {...registerRegister('role')} className="form-input">
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="MANAGER">Manager / Approver</option>
                <option value="VENDOR">Vendor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Country</label>
              <input {...registerRegister('country')} className="form-input" placeholder="e.g. India" />
            </div>

            <button type="submit" disabled={registerMutation.isPending} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '13px', justifyContent: 'center' }}>
              {registerMutation.isPending ? 'Registering...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
