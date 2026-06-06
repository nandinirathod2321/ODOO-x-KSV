import api from '../lib/axios.js';

export const getApprovals = async () => {
  const { data } = await api.get('/approvals');
  return data.data ?? data;
};

export const getApprovalById = async (id) => {
  const { data } = await api.get(`/approvals/${id}`);
  return data.data ?? data;
};

export const approveQuotation = async (id, remarks) => {
  const { data } = await api.patch(`/approvals/${id}/approve`, { remarks });
  return data.data ?? data;
};

export const rejectQuotation = async (id, remarks) => {
  const { data } = await api.patch(`/approvals/${id}/reject`, { remarks });
  return data.data ?? data;
};
