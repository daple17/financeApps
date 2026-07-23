import React, { useState, useEffect } from 'react';
import { Plus, Receipt, RefreshCw, CheckCircle2, AlertCircle, Trash2, Eye } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'EXPENSE',
    description: '',
    amount: '',
    journalEntries: [
      { accountId: '', type: 'DEBIT', amount: '' },
      { accountId: '', type: 'CREDIT', amount: '' },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [trxRes, coaRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/coa')
      ]);
      if (trxRes.data.status === 'success') setTransactions(trxRes.data.data);
      if (coaRes.data.status === 'success') setAccounts(coaRes.data.data);
    } catch (err) {
      showError('Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Journal Entry dynamic helpers
  const handleJournalChange = (index, field, value) => {
    const updated = [...formData.journalEntries];
    updated[index][field] = value;
    setFormData({ ...formData, journalEntries: updated });
  };

  const addJournalRow = () => {
    setFormData({
      ...formData,
      journalEntries: [...formData.journalEntries, { accountId: '', type: 'DEBIT', amount: '' }],
    });
  };

  const removeJournalRow = (index) => {
    if (formData.journalEntries.length <= 2) {
      showError('Transaksi double-entry membutuhkan minimal 2 baris jurnal (Debit & Kredit)');
      return;
    }
    const updated = formData.journalEntries.filter((_, i) => i !== index);
    setFormData({ ...formData, journalEntries: updated });
  };

  // Balance calculation
  const totalDebit = formData.journalEntries
    .filter((j) => j.type === 'DEBIT')
    .reduce((sum, j) => sum + (Number(j.amount) || 0), 0);

  const totalCredit = formData.journalEntries
    .filter((j) => j.type === 'CREDIT')
    .reduce((sum, j) => sum + (Number(j.amount) || 0), 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      showError(`Jurnal tidak seimbang! Total Debit (Rp ${totalDebit.toLocaleString()}) !== Total Kredit (Rp ${totalCredit.toLocaleString()})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount || totalDebit),
        journalEntries: formData.journalEntries.map((j) => ({
          accountId: Number(j.accountId),
          type: j.type,
          amount: Number(j.amount),
        })),
      };

      const res = await api.post('/transactions', payload);
      showSuccess(res.data.message || 'Transaksi berhasil dicatat');
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`/transactions/${id}`);
      if (res.data.status === 'success') {
        setSelectedTrx(res.data.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      showError('Gagal memuat rincian transaksi');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PENDING_APPROVAL': return <Badge variant="warning">Pending Approval</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-400" />
            Manajemen Transaksi & Jurnal Umum
          </h1>
          <p className="text-sm text-slate-400 mt-1">Pencatatan pemasukan, pengeluaran & double-entry bookkeeping.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInitialData} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {hasPermission('transactions.create') && (
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Catat Transaksi Baru
            </Button>
          )}
        </div>
      </div>

      {/* Main Transactions Table */}
      <Card>
        <CardHeader
          title="Riwayat Transaksi Keuangan"
          subtitle={`Total ${transactions.length} transaksi tercatat`}
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data transaksi...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada transaksi yang dicatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{trx.transaction_number}</td>
                    <td className="py-3 px-4 text-slate-300">{trx.date}</td>
                    <td className="py-3 px-4 font-semibold text-xs text-slate-400">{trx.type}</td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{trx.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                      Rp {Number(trx.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(trx.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewDetail(trx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                        title="Lihat Rincian Jurnal"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Transaksi Keuangan & Jurnal"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Transaksi"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Tipe Transaksi</label>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="EXPENSE">EXPENSE (Pengeluaran Operasional)</option>
                <option value="INCOME">INCOME (Pemasukan Kas/Bank)</option>
                <option value="TRANSFER">TRANSFER (Pindah Buku Kas/Bank)</option>
                <option value="JOURNAL">JOURNAL (Jurnal Umum Langsung)</option>
              </select>
            </div>
          </div>

          <Input
            label="Keterangan / Deskripsi Transaksi"
            placeholder="Misal: Pembayaran Sewa Kantor Bulan Juli 2026"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <Input
            label="Nominal Total Transaksi (Rp)"
            type="number"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          {/* Dynamic Double-Entry Journal Section */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Rincian Jurnal Umum (Double-Entry)
              </span>
              <button
                type="button"
                onClick={addJournalRow}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris
              </button>
            </div>

            {formData.journalEntries.map((j, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={j.accountId}
                  onChange={(e) => handleJournalChange(idx, 'accountId', e.target.value)}
                  required
                >
                  <option value="">-- Pilih Akun COA --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.type})
                    </option>
                  ))}
                </select>

                <select
                  className="w-28 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={j.type}
                  onChange={(e) => handleJournalChange(idx, 'type', e.target.value)}
                >
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">KREDIT</option>
                </select>

                <input
                  type="number"
                  placeholder="Nominal"
                  className="w-32 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={j.amount}
                  onChange={(e) => handleJournalChange(idx, 'amount', e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => removeJournalRow(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Live Balance Summary */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="space-x-3">
                <span className="text-slate-400">Debit: <strong className="text-white">Rp {totalDebit.toLocaleString()}</strong></span>
                <span className="text-slate-400">Kredit: <strong className="text-white">Rp {totalCredit.toLocaleString()}</strong></span>
              </div>
              <div>
                {isBalanced ? (
                  <span className="text-sky-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SEIMBANG
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> TIDAK SEIMBANG (Selisih: Rp {Math.abs(totalDebit - totalCredit).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={!isBalanced}>
              <CheckCircle2 className="w-4 h-4" />
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Detail & Journal Entries Modal */}
      {selectedTrx && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Rincian Transaksi #${selectedTrx.transaction_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
              <div><span className="text-slate-400">Tanggal:</span> <span className="font-semibold text-white">{selectedTrx.date}</span></div>
              <div><span className="text-slate-400">Tipe:</span> <span className="font-semibold text-white">{selectedTrx.type}</span></div>
              <div><span className="text-slate-400">Pembuat:</span> <span className="font-semibold text-white">{selectedTrx.created_by_name}</span></div>
              <div><span className="text-slate-400">Penyetuju:</span> <span className="font-semibold text-white">{selectedTrx.approved_by_name || '-'}</span></div>
              <div className="col-span-2"><span className="text-slate-400">Deskripsi:</span> <p className="font-medium text-slate-200 mt-1">{selectedTrx.description}</p></div>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">Entri Jurnal Umum (Double-Entry)</h4>
              <div className="overflow-hidden rounded-xl border border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase">
                    <tr>
                      <th className="p-2.5">Kode Akun</th>
                      <th className="p-2.5">Nama Akun</th>
                      <th className="p-2.5 text-right">Debit (Rp)</th>
                      <th className="p-2.5 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedTrx.journal_entries?.map((j) => (
                      <tr key={j.id}>
                        <td className="p-2.5 font-mono text-sky-400">{j.account_code}</td>
                        <td className="p-2.5 text-slate-200">{j.account_name}</td>
                        <td className="p-2.5 text-right font-mono">
                          {j.entry_type === 'DEBIT' ? Number(j.amount).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {j.entry_type === 'CREDIT' ? Number(j.amount).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
