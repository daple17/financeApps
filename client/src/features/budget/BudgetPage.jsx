import React, { useState, useEffect } from 'react';
import { PieChart, Plus, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  // Form State
  const [formData, setFormData] = useState({
    accountId: '',
    periodMonth: currentMonth.toString(),
    periodYear: currentYear.toString(),
    allocatedAmount: '',
  });

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/budgets', {
        params: { year: selectedYear, month: selectedMonth }
      });
      if (res.data.status === 'success') {
        setBudgets(res.data.data);
      }
    } catch (err) {
      showError('Gagal memuat data anggaran');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/coa');
      if (res.data.status === 'success') {
        // Only get Expense/Asset accounts for budgeting usually, but we'll fetch all
        setAccounts(res.data.data.filter(a => a.type === 'EXPENSE' || a.type === 'ASSET'));
      }
    } catch (err) {
      // ignore silently for select options
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (isModalOpen && accounts.length === 0) {
      fetchAccounts();
    }
  }, [isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/budgets', {
        accountId: Number(formData.accountId),
        periodMonth: Number(formData.periodMonth),
        periodYear: Number(formData.periodYear),
        allocatedAmount: Number(formData.allocatedAmount)
      });
      showSuccess('Alokasi anggaran berhasil disimpan');
      setIsModalOpen(false);
      
      // If the budget we set is in the currently viewed period, refresh
      if (formData.periodMonth === selectedMonth && formData.periodYear === selectedYear) {
        fetchBudgets();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = (percentage) => {
    let colorClass = 'bg-emerald-500';
    let trackClass = 'bg-slate-800';
    
    if (percentage > 100) {
      colorClass = 'bg-rose-500';
      percentage = 100; // clamp for UI
    } else if (percentage >= 80) {
      colorClass = 'bg-amber-500';
    }

    return (
      <div className="w-full flex items-center gap-3">
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${trackClass}`}>
          <div 
            className={`h-full ${colorClass} transition-all duration-500`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-mono font-medium text-slate-300 w-12 text-right">
          {percentage.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-purple-400" />
            Manajemen Anggaran
          </h1>
          <p className="text-sm text-slate-400 mt-1">Pemantauan realisasi pengeluaran terhadap batas anggaran.</p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('budgets.manage') && (
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Set Alokasi Anggaran
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader 
          title="Monitoring Realisasi Anggaran" 
          subtitle="Bandingkan pemakaian (realisasi dari jurnal) dengan alokasi."
          action={
            <div className="flex items-center gap-2">
              <select 
                className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-purple-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Bulan {m}</option>
                ))}
              </select>
              <select 
                className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-purple-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={fetchBudgets} isLoading={isLoading}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data anggaran...</div>
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
            <p className="text-slate-400 text-sm">Belum ada anggaran yang dialokasikan untuk periode ini.</p>
            {hasPermission('budgets.manage') && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" /> Mulai Set Anggaran
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun</th>
                  <th className="py-3 px-4 text-right">Alokasi (Rp)</th>
                  <th className="py-3 px-4 text-right">Pemakaian (Rp)</th>
                  <th className="py-3 px-4 text-right">Sisa / Variance (Rp)</th>
                  <th className="py-3 px-4 w-48">Persentase (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {budgets.map((b) => {
                  const isOverBudget = b.usage_percentage > 100;
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-purple-400">{b.account_code}</td>
                      <td className="py-3 px-4 font-medium text-white">{b.account_name}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {Number(b.allocated_amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {Number(b.actual_used_amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'}>
                          {Number(b.remaining_amount).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {renderProgressBar(b.usage_percentage)}
                        {isOverBudget && (
                          <div className="text-[10px] text-rose-400 mt-1 flex items-center gap-1 justify-end">
                            <AlertTriangle className="w-3 h-3" /> Over Budget!
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Alokasi Anggaran"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Akun (COA)</label>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              required
            >
              <option value="">-- Pilih Akun --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Bulan</label>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.periodMonth}
                onChange={(e) => setFormData({ ...formData, periodMonth: e.target.value })}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Bulan {m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Tahun</label>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.periodYear}
                onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
              >
                {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Nominal Alokasi (Rp)"
            type="number"
            placeholder="0"
            value={formData.allocatedAmount}
            onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
            required
            min="0"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} className="bg-purple-600 hover:bg-purple-500 focus:ring-purple-500 border-purple-500/30">
              <CheckCircle2 className="w-4 h-4" />
              Simpan Anggaran
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
