import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, XCircle, RefreshCw, Wallet, FileText } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function ApprovalPage() {
  const [activeTab, setActiveTab] = useState('TRANSACTION');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();
  const currentUserId = useAuth().user?.id; // Assuming we can get the current user id this way, or we can rely on the backend 403

  const fetchPendingApprovals = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'OPERATION_COST' 
        ? '/approvals/pending?type=OPERATION_COST' 
        : '/approvals/pending';
      const res = await api.get(endpoint);
      if (res.data.status === 'success') {
        setPendingApprovals(res.data.data || []);
      }
    } catch (err) {
      showError(`Gagal memuat daftar pending approval untuk ${activeTab}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [activeTab]);

  const handleApprove = async (id) => {
    if (!window.confirm('Setujui pengajuan ini?')) return;
    try {
      const endpoint = activeTab === 'OPERATION_COST' 
        ? `/approvals/${id}/approve?type=OPERATION_COST` 
        : `/approvals/${id}/approve`;
      await api.post(endpoint);
      showSuccess('Pengajuan berhasil disetujui');
      fetchPendingApprovals();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyetujui pengajuan');
    }
  };

  const handleOpenRejectModal = (item) => {
    setSelectedItem(item);
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
      const endpoint = activeTab === 'OPERATION_COST' 
        ? `/approvals/${selectedItem.id}/reject?type=OPERATION_COST` 
        : `/approvals/${selectedItem.id}/reject`;
      await api.post(endpoint, { rejectionReason });
      showSuccess('Pengajuan telah ditolak');
      setIsRejectModalOpen(false);
      fetchPendingApprovals();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menolak pengajuan');
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
            Workflow Approval
          </h1>
          <p className="text-sm text-slate-400 mt-1">Persetujuan pengeluaran dan biaya operasional.</p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchPendingApprovals} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('TRANSACTION')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'TRANSACTION'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
          }`}
        >
          <Wallet className="w-4 h-4" /> Transaksi
        </button>
        <button
          onClick={() => setActiveTab('OPERATION_COST')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'OPERATION_COST'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" /> Operation Costs
        </button>
      </div>

      {/* Main Pending Table */}
      <Card>
        <CardHeader
          title={activeTab === 'TRANSACTION' ? "Pengajuan Transaksi (Pending Approval)" : "Pengajuan Operation Cost (Submitted)"}
          subtitle={`Terdapat ${pendingApprovals.length} item menunggu persetujuan`}
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data pengajuan...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="p-8 text-center text-sky-400 font-medium text-sm border border-dashed border-sky-800/40 rounded-xl bg-sky-950/20">
            ✔ Tidak ada pengajuan yang pending. Semua pengajuan telah diproses!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  {activeTab === 'TRANSACTION' ? (
                    <>
                      <th className="py-3 px-4">No. Transaksi</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Pembuat</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">Job Order / Operation</th>
                      <th className="py-3 px-4">Cost Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Submitted By</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-right">Aksi Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    {activeTab === 'TRANSACTION' ? (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{item.transaction_number}</td>
                        <td className="py-3 px-4 text-slate-300">{item.date}</td>
                        <td className="py-3 px-4 font-medium text-white">{item.created_by_name}</td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{item.description}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-base">
                          Rp {Number(item.amount).toLocaleString('id-ID')}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-sky-400">{item.job_order_number}</div>
                          <div className="font-mono text-xs text-amber-400">{item.operation_no}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{item.cost_type}</td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {item.description}
                          {item.reference_no && <div className="text-xs text-slate-500">Ref: {item.reference_no}</div>}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {item.created_by_name}
                          <div className="text-xs text-slate-500">{new Date(item.transaction_date).toLocaleDateString('id-ID')}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-base">
                          Rp {Number(item.amount).toLocaleString('id-ID')}
                        </td>
                      </>
                    )}
                    
                    <td className="py-3 px-4 text-right space-x-2">
                      {hasPermission('approvals.manage') ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenRejectModal(item)}
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
        title="Tolak Pengajuan"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-300">
            {activeTab === 'TRANSACTION' ? (
              <>Transaksi <strong className="text-amber-400">#{selectedItem?.transaction_number}</strong></>
            ) : (
              <>Biaya Operasional <strong className="text-amber-400">#{selectedItem?.operation_no} - {selectedItem?.cost_type}</strong></>
            )}
            {' '}dengan nominal <strong className="text-white">Rp {Number(selectedItem?.amount || 0).toLocaleString()}</strong> akan ditolak.
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
              Tolak Pengajuan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
