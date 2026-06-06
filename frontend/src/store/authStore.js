import { create } from 'zustand';
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
