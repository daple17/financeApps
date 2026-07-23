import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize & check current user session
  useEffect(() => {
    async function loadUserSession() {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.status === 'success') {
            setUser(res.data.data);
          }
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    }

    loadUserSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.status === 'success') {
      const { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      setUser(userData);
      setAccessToken(newAccessToken);
      return userData;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setAccessToken(null);
    }
  };

  const hasPermission = (permission) => {
    if (!user || !user.role || !user.role.permissions) return false;
    const permissions = user.role.permissions;
    if (permissions.includes('*')) return true;
    if (permissions.includes(permission)) return true;
    
    const [category] = permission.split('.');
    if (permissions.includes(`${category}.*`)) return true;

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
