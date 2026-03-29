// Use environment variable in production, fallback to relative path
const getApiUrl = () => {
  // Try to use the environment variable first
  const envUrl = import.meta.env?.VITE_API_URL;

  if (envUrl) {
    return envUrl;
  }

  // In development, use relative path (no /api prefix)
  if (typeof window !== 'undefined' && !window.location.hostname.includes('vercel')) {
    return '';
  }

  // In production, use same domain API (no /api prefix)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

const API_URL = getApiUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  getHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint, params) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`${endpoint}${queryString}`);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiService();
export default api;
