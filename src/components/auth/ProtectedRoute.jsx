import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, initializing } = useSelector((state) => state.auth);

  if (initializing) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-xs font-medium text-white tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
