import api from '../lib/axios.js';
import useAuthStore from '../store/authStore.js';

export const getPurchaseOrders = async () => {
  const role = useAuthStore.getState().role;
  const url = role === 'VENDOR' ? '/my/purchase-orders' : '/purchase-orders';
  const { data } = await api.get(url);
  return data.data ?? data;
};

export const getPurchaseOrderById = async (id) => {
  const { data } = await api.get(`/purchase-orders/${id}`);
  return data.data ?? data;
};
