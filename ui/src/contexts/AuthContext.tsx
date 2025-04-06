import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, LoginRequest } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isSessionExpired: boolean;
  clearExpiredSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Listen for storage events (for multi-tab coordination)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null) {
        // Token was removed in another tab
        setIsAuthenticated(false);
        setUsername(null);
        setIsSessionExpired(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      setLoading(true);
      const response = await apiLogin(data);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      
      setIsAuthenticated(true);
      setUsername(response.username);
      setIsSessionExpired(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername(null);
  };

  const clearExpiredSession = () => {
    setIsSessionExpired(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      username, 
      login, 
      logout, 
      loading,
      isSessionExpired,
      clearExpiredSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 