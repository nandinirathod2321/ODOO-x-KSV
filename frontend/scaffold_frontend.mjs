import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, 'src');

const dirs = [
  'assets',
  'styles',
  'config',
  'lib',
  'hooks',
  'context',
  'store',
  'services',
  'layouts',
  'components/common',
  'components/layout',
  'components/dashboard',
  'components/vendor',
  'components/rfq',
  'components/quotation',
  'components/approval',
  'components/purchase-order',
  'components/invoice',
  'components/activity',
  'components/reports',
  'templates',
  'pages/auth',
  'print',
  'guards'
];

dirs.forEach(d => fs.mkdirSync(path.join(frontendDir, d), { recursive: true }));

const files = {
  'main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ModalProvider>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" />
          </BrowserRouter>
        </ModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
`,
  'App.jsx': `import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute.jsx';
import RoleGuard from './guards/RoleGuard.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import PrintLayout from './layouts/PrintLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { ROLES } from './config/constants.js';

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
`,
  'styles/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-neutral-50 text-neutral-900 font-sans antialiased;
  }
}
`,
  'config/constants.js': `export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  PROCUREMENT_OFFICER: 'procurement_officer',
  VENDOR: 'vendor',
};

export const PERMISSIONS = {
  CREATE_RFQ: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER],
  COMPARE_QUOTATIONS: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER],
  SUBMIT_QUOTATION: [ROLES.VENDOR],
  APPROVE_REQUEST: [ROLES.ADMIN, ROLES.MANAGER],
  GENERATE_PO: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER],
  GENERATE_INVOICE: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER],
  SEND_INVOICE_EMAIL: [ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER],
  MANAGE_VENDORS: [ROLES.ADMIN],
  VIEW_REPORTS: [ROLES.ADMIN, ROLES.MANAGER],
  VIEW_ACTIVITY_LOGS: [ROLES.ADMIN, ROLES.MANAGER],
};
`,
  'lib/axios.js': `import axios from 'axios';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action");
    }
    return Promise.reject(error);
  }
);

export default api;
`,
  'lib/queryClient.js': `import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
`,
  'store/authStore.js': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios.js';

const useAuthStore = create(persist((set, get) => ({
  user: null,
  token: null,
  role: null,
  permissions: [],
  isAuthenticated: false,

  login: (user, token) => set({
    user, token, role: user.role,
    permissions: user.permissions ?? [],
    isAuthenticated: true,
  }),

  logout: () => set({
    user: null, token: null, role: null,
    permissions: [], isAuthenticated: false,
  }),

  rehydrate: async () => {
    try {
      const { data } = await api.get('/auth/profile');
      set({ user: data.data, role: data.data.role, permissions: data.data.permissions ?? [] });
    } catch {
      get().logout();
    }
  },
}), { name: 'vendorbridge-auth' }));

export default useAuthStore;
`,
  'services/auth.service.js': `import api from '../lib/axios.js';

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};
`,
  'layouts/AppLayout.jsx': `import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="w-64 bg-neutral-900 text-white flex-shrink-0">
        <div className="p-4 font-bold text-xl">VendorBridge</div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="font-semibold text-neutral-800">Dashboard</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
`,
  'layouts/AuthLayout.jsx': `import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-card w-full max-w-md p-8">
        <Outlet />
      </div>
    </div>
  );
}
`,
  'pages/auth/LoginPage.jsx': `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../services/auth.service.js';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });
  const setAuth = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      toast.success('Logged in successfully');
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-neutral-900">VendorBridge Login</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} className="w-full border rounded px-3 py-2" />
          {errors.email && <p className="text-danger-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" {...register('password')} className="w-full border rounded px-3 py-2" />
          {errors.password && <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full bg-primary-600 text-white rounded py-2 hover:bg-primary-700">
          {mutation.isPending ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
`,
  'pages/DashboardPage.jsx': `import useAuthStore from '../store/authStore.js';

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome back, {user?.name}</h1>
      <p className="text-neutral-600">This is your Dashboard.</p>
    </div>
  );
}
`,
  'guards/ProtectedRoute.jsx': `import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
`,
  'guards/RoleGuard.jsx': `import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

export default function RoleGuard({ children, allowedRoles }) {
  const role = useAuthStore(state => state.role);
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
}
`,
  'context/ThemeContext.jsx': `import { createContext, useState } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
`,
  'context/ModalContext.jsx': `import { createContext, useState } from 'react';

export const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);
  return (
    <ModalContext.Provider value={{ openModal: setModal, closeModal: () => setModal(null) }}>
      {children}
      {modal}
    </ModalContext.Provider>
  );
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(frontendDir, filepath), content);
}

// Update tailwind config
fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8', 800:'#1e40af', 900:'#1e3a8a' },
        danger: { 100:'#fee2e2', 600:'#dc2626', 800:'#991b1b' },
        neutral: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
`);

console.log('Frontend scaffolding completed.');
