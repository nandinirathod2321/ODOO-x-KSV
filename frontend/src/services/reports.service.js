import api from '../lib/axios.js';

export const getVendorPerformance = async () => {
  const { data } = await api.get('/reports/vendor-performance');
  return data.data ?? data;
};

export const getSpendingSummary = async () => {
  const { data } = await api.get('/reports/spending-summary');
  return data.data ?? data;
};

export const getMonthlyTrends = async () => {
  const { data } = await api.get('/reports/monthly-trends');
  return data.data ?? data;
};

export const getProcurementStats = async () => {
  const { data } = await api.get('/reports/procurement-stats');
  return data.data ?? data;
};

export const exportExcelReport = async () => {
  const response = await api.get('/reports/export', { responseType: 'blob' });
  return response.data;
};
