import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jobrobotsaii.vercel.app/api';

// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and let AuthContext handle redirect
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      // Use a custom event so AuthContext can react without page reload
      window.dispatchEvent(new CustomEvent('admin:logout'));
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  get(endpoint, params) {
    return apiClient.get(endpoint, { params }).then((res) => res.data);
  },

  post(endpoint, data) {
    return apiClient.post(endpoint, data).then((res) => res.data);
  },

  put(endpoint, data) {
    return apiClient.put(endpoint, data).then((res) => res.data);
  },

  delete(endpoint) {
    return apiClient.delete(endpoint).then((res) => res.data);
  },
};

export default api;
