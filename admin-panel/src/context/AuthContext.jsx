import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

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
  const [isReady, setIsReady] = useState(false); // app finished initializing

  const isFetchingRef = useRef(false);

  const fetchAdmin = async () => {
    if (isFetchingRef.current) return; // prevent concurrent fetches
    isFetchingRef.current = true;

    try {
      const response = await api.get('/admin/me');
      if (response.success) {
        setAdmin(response.data.admin);
        setIsReady(true);
      } else {
        // success:false from API — token valid but no admin (shouldn't happen)
        setAdmin(null);
        setIsReady(true);
      }
    } catch (error) {
      // 401 or network error — clear auth state
      console.error('fetchAdmin failed:', error?.response?.data || error?.message);
      setAdmin(null);
      localStorage.removeItem('adminToken');
      setToken(null);
      setIsReady(true);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // On mount: validate token once
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      fetchAdmin();
    } else {
      setIsReady(true);
    }
  }, []); // intentionally empty — run only once on mount

  // Listen for unauthorized events from api.js
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('admin:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('admin:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });

      if (!response.success) {
        return { success: false, message: response.message || 'Login failed' };
      }

      const { token: newToken, admin: adminData } = response.data;

      // Store token
      localStorage.setItem('adminToken', newToken);
      setToken(newToken);
      setAdmin(adminData);
      setIsReady(true);

      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
    setIsReady(false);
  };

  return (
    <AuthContext.Provider value={{ admin, token, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
