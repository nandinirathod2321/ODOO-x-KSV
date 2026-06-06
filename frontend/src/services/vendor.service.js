import api from '../lib/axios.js';

export const getVendors = async () => {
  const { data } = await api.get('/vendors');
  return data.data ?? data;
};

export const getVendorById = async (id) => {
  const { data } = await api.get(`/vendors/${id}`);
  return data.data ?? data;
};

export const createVendor = async (vendorData) => {
  const { data } = await api.post('/vendors', vendorData);
  return data.data ?? data;
};

export const updateVendor = async (id, vendorData) => {
  const { data } = await api.patch(`/vendors/${id}`, vendorData);
  return data.data ?? data;
};

export const deleteVendor = async (id) => {
  const { data } = await api.delete(`/vendors/${id}`);
  return data.data ?? data;
};

export const getVendorPerformance = async (id) => {
  const { data } = await api.get(`/vendors/${id}/performance`);
  return data.data ?? data;
};
