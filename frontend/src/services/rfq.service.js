import api from '../lib/axios.js';
import useAuthStore from '../store/authStore.js';

export const getRfqs = async () => {
  const role = useAuthStore.getState().role;
  const url = role === 'VENDOR' ? '/my/rfqs' : '/rfqs';
  const { data } = await api.get(url);
  return data.data ?? data;
};

export const getRfqById = async (id) => {
  const { data } = await api.get(`/rfqs/${id}`);
  return data.data ?? data;
};

export const createRfq = async (rfqData) => {
  const { data } = await api.post('/rfqs', rfqData);
  return data.data ?? data;
};

export const updateRfq = async (id, rfqData) => {
  const { data } = await api.patch(`/rfqs/${id}`, rfqData);
  return data.data ?? data;
};

export const publishRfq = async (id) => {
  const { data } = await api.patch(`/rfqs/${id}/publish`);
  return data.data ?? data;
};

export const closeRfq = async (id) => {
  const { data } = await api.patch(`/rfqs/${id}/close`);
  return data.data ?? data;
};

export const deleteRfq = async (id) => {
  const { data } = await api.delete(`/rfqs/${id}`);
  return data.data ?? data;
};
