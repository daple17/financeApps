import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function ApprovalPage() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchPendingApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      if (res.data.status === 'success') {
        setPendingApprovals(res.data.data);
      }
    } catch (err) {
      showError('Gagal memuat daftar pending approval');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Setujui pengajuan pengeluaran transaksi ini?')) return;
    try {
      await api.post(`/approvals/${id}/approve`);
      showSuccess('Pengajuan transaksi berhasil disetujui');
      fetchPendingApprovals();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyetujui transaksi');
    }
  };

  const handleOpenRejectModal = (trx) => {
    setSelectedTrx(trx);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason) {
      showError('Alasan penolakan pengajuan wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/approvals/${selectedTrx.id}/reject`, { rejectionReason });
      showSuccess('Pengajuan transaksi telah ditolak');
      setIsRejectModalOpen(false);
      fetchPendingApprovals();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menolak transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            Workflow Approval Transaksi
          </h1>
          <p className="text-sm text-slate-400 mt-1">Persetujuan pengeluaran bernominal tinggi (Nominal &ge; Rp 5.000.000).</p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchPendingApprovals} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Main Pending Table */}
      <Card>
        <CardHeader
          title="Pengajuan Menunggu Persetujuan (Pending Approval)"
          subtitle={`Terdapat ${pendingApprovals.length} transaksi membutuhkan persetujuan Manajer Keuangan`}
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data pengajuan...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="p-8 text-center text-sky-400 font-medium text-sm border border-dashed border-sky-800/40 rounded-xl bg-sky-950/20">
            ✔ Tidak ada pengajuan transaksi yang pending. Semua pengajuan telah diproses!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pembuat</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal Pengeluaran</th>
                  <th className="py-3 px-4 text-right">Aksi Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingApprovals.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{trx.transaction_number}</td>
                    <td className="py-3 px-4 text-slate-300">{trx.date}</td>
                    <td className="py-3 px-4 font-medium text-white">{trx.created_by_name}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{trx.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white text-base">
                      Rp {Number(trx.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {hasPermission('approvals.manage') ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(trx.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenRejectModal(trx)}
                            className="text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Tolak
                          </Button>
                        </>
                      ) : (
                        <Badge variant="warning">Akses View Only</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Pengajuan Transaksi"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-300">
            Transaksi <strong className="text-amber-400">#{selectedTrx?.transaction_number}</strong> dengan nominal{' '}
            <strong className="text-white">Rp {Number(selectedTrx?.amount || 0).toLocaleString()}</strong> akan ditolak.
          </p>

          <Input
            label="Alasan Penolakan Pengajuan"
            placeholder="Misal: Anggaran tidak mencukupi / Bukti fisik nota tidak melampirkan rincian"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Tolak Transaksi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
