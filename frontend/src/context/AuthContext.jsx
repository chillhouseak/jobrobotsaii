import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = apiService.getUser();
      const token = apiService.getToken();

      // Fast local check: is token valid and not expired?
      if (!token || !apiService.isAuthenticated()) {
        apiService.removeToken();
        setLoading(false);
        return;
      }

      // Token exists and is locally valid — restore session immediately
      if (storedUser) {
        setUser(storedUser);
      }

      // Then verify with backend (silent refresh)
      try {
        const response = await apiService.getMe();
        if (response.success) {
          setUser(response.data.user);
          localStorage.setItem('jobrobots_user', JSON.stringify(response.data.user));
        }
      } catch {
        // Backend says token invalid — clear auth
        apiService.removeToken();
        setUser(null);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiService.login(email, password);
      if (response.success) {
        // Store user and token
        localStorage.setItem('jobrobots_user', JSON.stringify(response.data.user));
        if (response.data.token) {
          apiService.setToken(response.data.token);
        }
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await apiService.register(name, email, password);
      if (response.success) {
        localStorage.setItem('jobrobots_user', JSON.stringify(response.data.user));
        if (response.data.token) {
          apiService.setToken(response.data.token);
        }
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = useCallback(() => {
    apiService.removeToken();
    setUser(null);
    setError(null);
    // Let ProtectedRoute/PublicRoute handle the redirect via React Router
    // No window.location.href — React state stays intact
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
