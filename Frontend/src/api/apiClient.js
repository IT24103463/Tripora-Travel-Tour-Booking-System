import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/api$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tripora_token') || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tripora_token');
      localStorage.removeItem('tripora_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export default api;
