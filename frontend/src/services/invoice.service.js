import api from '../lib/axios.js';
import useAuthStore from '../store/authStore.js';

export const getInvoices = async () => {
  const role = useAuthStore.getState().role;
  const url = role === 'VENDOR' ? '/my/invoices' : '/invoices';
  const { data } = await api.get(url);
  return data.data ?? data;
};

export const getInvoiceById = async (id) => {
  const { data } = await api.get(`/invoices/${id}`);
  return data.data ?? data;
};

export const generateInvoice = async (poId) => {
  const { data } = await api.post('/invoices/generate', { purchaseOrderId: poId });
  return data.data ?? data;
};

export const markPaid = async (id) => {
  const { data } = await api.patch(`/invoices/${id}/mark-paid`);
  return data.data ?? data;
};

export const downloadInvoicePdf = async (id) => {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  return response.data;
};

export const sendInvoiceEmail = async (id, emailData) => {
  const { data } = await api.post(`/invoices/${id}/send-email`, emailData);
  return data.data ?? data;
};
