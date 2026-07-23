import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { TrendingUp, Wallet, CheckSquare, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    totalKasBank: 0,
    pendapatanBulanIni: 0,
    pendingApprovals: 0,
    penggunaanAnggaran: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/reports/dashboard-summary');
        if (res.data.status === 'success') {
          setSummary(res.data.data);
        }
      } catch (err) {
        console.error(err);
        showError('Gagal memuat data dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Financial Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Ringkasan arus kas, saldo akun, dan pengajuan persetujuan transaksi.</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Kas & Bank</span>
              <div className="text-xl font-bold text-white mt-1">
                {isLoading ? '...' : formatCurrency(summary.totalKasBank)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Pendapatan Bulan Ini</span>
              <div className="text-xl font-bold text-white mt-1">
                {isLoading ? '...' : formatCurrency(summary.pendapatanBulanIni)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {isLoading ? '...' : `${summary.pendingApprovals} Transaksi`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Penggunaan Anggaran</span>
              <div className="text-xl font-bold text-white mt-1">
                {isLoading ? '...' : `${summary.penggunaanAnggaran}%`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Ringkasan Modul" subtitle="Semua modul API backend aktif dan siap digunakan." />
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 space-y-2">
          <p>✔ Design System & UI Layouts (Fase 5) Selesai.</p>
          <p>👉 Pada <b>Fase 6</b>, kita akan melengkapi seluruh interaksi form & tabel untuk Chart of Accounts, Transaksi, Approval, Anggaran, dan Laporan Keuangan.</p>
        </div>
      </Card>
    </div>
  );
}
