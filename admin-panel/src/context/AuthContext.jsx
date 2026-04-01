import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  // Fetch admin data from /api/admin/me
  const fetchAdmin = useCallback(async () => {
    try {
      const response = await api.get('/admin/me');
      if (response.success) {
        setAdmin(response.data.admin);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
      } else {
        // API returned success:false — token valid but no admin data
        logout();
      }
    } catch (error) {
      // 401 is handled by axios interceptor (clears token + dispatches event)
      // Network errors here mean backend is unreachable
      const isAuthError = error.response?.status === 401 || error.message === 'Request failed';
      if (isAuthError) {
        logout();
      }
      // Don't logout on network errors — just stop loading
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: restore admin from localStorage if token exists
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminData');
    if (savedAdmin && token) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        // Corrupted data — clear it
        localStorage.removeItem('adminData');
      }
    }

    // Validate token with backend (fetch fresh admin data)
    fetchAdmin();
  }, []); // Run once on mount

  // Listen for 401 events from axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };
    window.addEventListener('admin:logout', handleLogout);
    return () => window.removeEventListener('admin:logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      if (response.success) {
        const { token: newToken, admin: adminData } = response.data;
        localStorage.setItem('adminToken', newToken);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        setToken(newToken);
        setAdmin(adminData);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setToken(null);
    setAdmin(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
