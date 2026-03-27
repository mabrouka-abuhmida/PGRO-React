/**
 * ProtectedRoute - Route wrapper that requires specific user role
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/',
}) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !hasRole(requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

