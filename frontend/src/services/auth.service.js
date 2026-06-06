import api from '../lib/axios.js';

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

export const registerUser = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};
