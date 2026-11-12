import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PublicOnlyRouteProps {
  children: React.ReactElement;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const origin = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={origin} replace />;
  }

  return children;
};

