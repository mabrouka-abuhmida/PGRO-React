/**
 * Auth context for managing current user role (frontend-only for simplicity)
 * Uses localStorage to persist role selection
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'current_user_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user role from localStorage on mount
    const loadUser = () => {
      try {
        const storedRole = localStorage.getItem(STORAGE_KEY);
        if (storedRole) {
          const role = storedRole as UserRole;
          setUserState({
            id: `${role}-user`,
            email: `${role.toLowerCase()}@usw.ac.uk`,
            full_name: `${role} User`,
            role: role,
            is_active: true,
          });
        }
      } catch (error) {
        logger.error('Error loading user from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, newUser.role);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        hasRole,
        setUser,
        logout,
      }}
    >
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

