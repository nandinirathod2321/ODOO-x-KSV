import api from '../lib/axios.js';
import useAuthStore from '../store/authStore.js';

export const getQuotations = async () => {
  const role = useAuthStore.getState().role;
  const url = role === 'VENDOR' ? '/my/quotations' : '/quotations';
  const { data } = await api.get(url);
  return data.data ?? data;
};

export const getQuotationById = async (id) => {
  const { data } = await api.get(`/quotations/${id}`);
  return data.data ?? data;
};

export const compareQuotations = async (rfqId) => {
  const { data } = await api.get(`/quotations/compare/${rfqId}`);
  return data.data ?? data;
};

export const submitQuotation = async (quoteData) => {
  const { data } = await api.post('/quotations', quoteData);
  return data.data ?? data;
};

export const updateQuotation = async (id, quoteData) => {
  const { data } = await api.patch(`/quotations/${id}`, quoteData);
  return data.data ?? data;
};

export const selectWinner = async (id) => {
  const { data } = await api.patch(`/quotations/${id}/select-winner`);
  return data.data ?? data;
};

export const simulateBids = async (rfqId) => {
  const { data } = await api.post(`/quotations/simulate-bids/${rfqId}`);
  return data.data ?? data;
};
