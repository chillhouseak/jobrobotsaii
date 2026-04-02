import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  const [isReady, setIsReady] = useState(false);

  const isFetchingRef = useRef(false);

  // Define logout FIRST so useEffect can reference it
  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
    setIsReady(false);
  }, []);

  const fetchAdmin = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const response = await api.get('/admin/me');
      if (response.success) {
        setAdmin(response.data.admin);
        setIsReady(true);
      } else {
        setAdmin(null);
        setIsReady(true);
      }
    } catch (error) {
      console.error('fetchAdmin failed:', error?.response?.data?.message || error?.message);
      // 401 or network error — logout
      logout();
    } finally {
      isFetchingRef.current = false;
    }
  }, [logout]);

  // On mount: validate token once
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      fetchAdmin();
    } else {
      setIsReady(true);
    }
  }, [fetchAdmin]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });

      if (!response.success) {
        return { success: false, message: response.message || 'Login failed' };
      }

      const { token: newToken, admin: adminData } = response.data;

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

  return (
    <AuthContext.Provider value={{ admin, token, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
