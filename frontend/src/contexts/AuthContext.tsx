import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { authApi } from '../services/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('railopt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('railopt_token');
      if (savedToken) {
        try {
          const userData = await authApi.getMe(savedToken);
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem('railopt_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    restoreSession();
    
    const handleUnauthorized = () => {
      localStorage.removeItem('railopt_token');
      setToken(null);
      setUser(null);
    };
    
    window.addEventListener('railopt-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('railopt-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('railopt_token', res.access_token);
    setToken(res.access_token);
    // Backend returns flat fields, not a nested user object — build User from them
    const userData: import('../types/auth').User = {
      id: (res as any).user_id ?? '',
      email: (res as any).email ?? email,
      full_name: (res as any).full_name ?? '',
      role: (res as any).role,
      department_id: (res as any).department_id ?? null,
      department_name: null,
    };
    setUser(userData);
  };

  const logout = () => {
    if (token) authApi.logout(token);
    localStorage.removeItem('railopt_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canWrite = (dept?: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'OPERATIONS_VIEWER') return false;
    if (dept && user.department_name && dept !== user.department_name) return false;
    return true;
  };

  const isReadOnly = () => {
    if (!user) return true;
    return user.role === 'OPERATIONS_VIEWER';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, hasRole, canWrite, isReadOnly }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
