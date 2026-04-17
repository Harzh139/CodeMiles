import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://codemiles-4.onrender.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAuthUrl = () => `${api.defaults.baseURL}/auth/github`;

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const readRepo = async (repoUrl) => {
  const response = await api.post('/repo/read', { repoUrl });
  return response.data;
};

export const getCodeChanges = async (files, instruction) => {
  const response = await api.post('/ai/change', { files, instruction });
  return response.data;
};

export const pushCommit = async (repoUrl, changes) => {
  const response = await api.post('/push/commit', { repoUrl, changes });
  return response.data;
};

export const revertCommit = async (repoUrl, changes) => {
  const response = await api.post('/push/revert', { repoUrl, changes });
  return response.data;
};

export default api;
