import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  // If user is authenticated, render the protected content
  if (currentUser) {
    return <>{children}</>;
  }

  // If user is not authenticated, redirect to signup
  return <Navigate to="/signup" replace />;
};

export default ProtectedRoute;
