import React from 'react';
import { Menu, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      {/* Left: Mobile Toggle & Page Info */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs text-slate-400 font-medium">Sistem Keuangan Organisasi</span>
          <h1 className="text-sm font-semibold text-white">Selamat Datang, {user?.name || 'User'}</h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400"></span>
        </button>

        <div className="h-6 w-px bg-slate-800 my-auto" />

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-950/40 transition border border-transparent hover:border-rose-800/40"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
