import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ requiredPermission }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-slate-400">Memuat sesi pengguna...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-4 my-10 max-w-md mx-auto">
        <div className="text-rose-400 font-bold text-lg">Akses Ditolak (403 Forbidden)</div>
        <p className="text-slate-400 text-sm">
          Role akun Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
