import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Receipt,
  CheckSquare,
  PieChart,
  FileSpreadsheet,
  X,
  Building2,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasPermission } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: '*' },
    { name: 'Job Order', path: '/job-orders', icon: Truck, permission: 'job_orders.read', section: 'operasional' },
    { name: 'Chart of Accounts', path: '/coa', icon: FolderTree, permission: 'coa.read', section: 'keuangan' },
    { name: 'Transaksi', path: '/transactions', icon: Receipt, permission: 'transactions.read', section: 'keuangan' },
    { name: 'Approval Flow', path: '/approvals', icon: CheckSquare, permission: 'approvals.read', section: 'keuangan' },
    { name: 'Manajemen Anggaran', path: '/budgets', icon: PieChart, permission: 'budgets.read', section: 'keuangan' },
    { name: 'Laporan Keuangan', path: '/reports', icon: FileSpreadsheet, permission: 'reports.read', section: 'keuangan' },
  ];

  const adminItems = [
    { name: 'User Management', path: '/admin/users', permission: 'users.read' },
    { name: 'Role Management', path: '/admin/roles', permission: 'roles.read' },
  ];

  const filteredNavItems = navItems.filter((item) => item.permission === '*' || hasPermission(item.permission));
  const filteredAdminItems = adminItems.filter((item) => item.permission === '*' || hasPermission(item.permission));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight">OrgFinance</span>
                <span className="block text-[10px] text-sky-400 font-medium">FINANCIAL SUITE</span>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Menu Utama
            </div>
            {filteredNavItems.filter(i => !i.section).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {filteredNavItems.some(i => i.section === 'operasional') && (
              <>
                <div className="px-3 pt-4 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Operasional
                </div>
                {filteredNavItems.filter(i => i.section === 'operasional').map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </>
            )}
            
            {filteredNavItems.some(i => i.section === 'keuangan') && (
              <>
                <div className="px-3 pt-4 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Keuangan
                </div>
                {filteredNavItems.filter(i => i.section === 'keuangan').map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </>
            )}

            {filteredAdminItems.length > 0 && (
              <>
                <div className="px-3 pt-4 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Administrator
                </div>
                {filteredAdminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* User Info Bottom Box */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="flex items-center gap-1 text-[10px] text-sky-400 font-medium truncate mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                {user?.role?.name || 'User'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
