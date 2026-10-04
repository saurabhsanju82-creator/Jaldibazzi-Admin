import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, initializing } = useSelector((state) => state.auth);

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FiShield className="text-2xl animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white">Super Admin Control</h3>
            <p className="text-xs text-slate-400">Verifying authorized administrative access...</p>
          </div>
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
