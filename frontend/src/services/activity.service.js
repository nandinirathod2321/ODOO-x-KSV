import api from '../lib/axios.js';

export const getActivityLogs = async () => {
  const { data } = await api.get('/activity-logs');
  return data.data ?? data;
};
