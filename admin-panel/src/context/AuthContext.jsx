import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAdmin();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchAdmin = async () => {
    try {
      const response = await api.get('/admin/me');
      if (response.success) {
        setAdmin(response.data.admin);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch admin:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/admin/login', { email, password });
    if (response.success) {
      localStorage.setItem('adminToken', response.data.token);
      setToken(response.data.token);
      setAdmin(response.data.admin);
      return { success: true };
    }
    return { success: false, message: response.message };
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
