import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, Trash2, Receipt, AlertCircle, Plus, Check, History } from 'lucide-react';
import settlementService from '../../../services/settlementService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import SettlementPostingModal from './components/SettlementPostingModal';

export default function SettlementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const [settlement, setSettlement] = useState(null);
  const [eligibleCosts, setEligibleCosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCostId, setProcessingCostId] = useState(null);

  const [notes, setNotes] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showPostingModal, setShowPostingModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await settlementService.getById(id);
      if (res.status === 'success') {
        setSettlement(res.data);
        setNotes(res.data.notes || '');
        if (res.data.status === 'DRAFT') {
          fetchEligibleCosts();
        }
      }
    } catch (err) {
      showError('Gagal memuat detail Settlement');
      navigate('/settlements');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEligibleCosts = async () => {
    try {
      const res = await settlementService.getEligibleCosts(id);
      if (res.status === 'success') {
        setEligibleCosts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleItem = async (cost, isAdded, itemId = null) => {
    setIsProcessing(true);
    setProcessingCostId(cost.id);
    try {
      if (!isAdded) {
        await settlementService.addItem(id, cost.id);
        showSuccess('Item ditambahkan');
      } else {
        if (!itemId) {
          // If we don't have the itemId directly, find it from settlement.items
          const existingItem = settlement.items.find(i => i.operation_cost_id === cost.id);
          if (existingItem) itemId = existingItem.id;
        }
        if (itemId) {
          const confirmRemove = window.confirm('Hapus cost ini dari settlement?');
          if (!confirmRemove) return;
          await settlementService.removeItem(id, itemId);
          showSuccess('Item dihapus');
        }
      }
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal mengubah item');
    } finally {
      setIsProcessing(false);
      setProcessingCostId(null);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await settlementService.updateNotes(id, notes);
      showSuccess('Notes disimpan');
      fetchData();
    } catch (err) {
      showError('Gagal menyimpan notes');
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await settlementService.submitSettlement(id);
      showSuccess('Settlement berhasil disubmit ke Finance');
      setShowSubmitConfirm(false);
      fetchData();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data.message.includes('Cost Type')) {
        showError(`Submit gagal: ${err.response.data.message}`);
      } else {
        showError(err.response?.data?.message || 'Gagal mensubmit Settlement');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevise = async () => {
    setIsProcessing(true);
    try {
      await settlementService.reviseSettlement(id);
      showSuccess('Settlement dikembalikan ke DRAFT untuk direvisi');
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal merevisi Settlement');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Hapus draft Settlement ini? Tindakan ini tidak dapat dibatalkan.');
    if (!confirmDelete) return;
    try {
      await settlementService.deleteSettlement(id);
      showSuccess('Settlement dihapus');
      navigate('/settlements');
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menghapus Settlement');
    }
  };

  if (isLoading || !settlement) {
    return <div className="p-6 text-center text-gray-400">Memuat data...</div>;
  }

  const isDraft = settlement.status === 'DRAFT';
  const isSubmitted = settlement.status === 'SUBMITTED';
  const isRejected = settlement.status === 'REJECTED';
  const isApproved = settlement.status === 'APPROVED';
  const isPosted = settlement.status === 'POSTED';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const diff = Number(settlement.difference) || 0;
  const isSurplus = diff > 0;
  const isDeficit = diff < 0;
  const isBalanced = diff === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settlements')}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary-400" />
              Settlement: {settlement.settlement_no}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Dibuat pada {new Date(settlement.settlement_date).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && hasPermission('settlement.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Hapus
            </Button>
          )}
          {isDraft && hasPermission('settlement.submit') && (
            <Button variant="primary" onClick={() => setShowSubmitConfirm(true)}>
              <Send className="w-4 h-4 mr-2" /> Submit ke Finance
            </Button>
          )}
          {isRejected && hasPermission('settlement.edit') && (
            <Button variant="warning" onClick={handleRevise} isLoading={isProcessing}>
              <RefreshCw className="w-4 h-4 mr-2" /> Revisi (Kembali ke DRAFT)
            </Button>
          )}
          {isApproved && hasPermission('settlement.post') && (
            <Button variant="success" onClick={() => setShowPostingModal(true)}>
              <Send className="w-4 h-4 mr-2" /> Post Settlement
            </Button>
          )}
          {isPosted && settlement.transaction_id && (
            <Button variant="primary" onClick={() => navigate(`/finance/transactions/${settlement.transaction_id}`)}>
              <Receipt className="w-4 h-4 mr-2" /> View Transaction
            </Button>
          )}
        </div>
      </div>

      {isRejected && settlement.rejection_reason && (
        <div className="bg-rose-950/40 border border-rose-900 rounded-lg p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-400">Pengajuan Ditolak</h4>
            <p className="text-sm text-rose-300 mt-1">{settlement.rejection_reason}</p>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-warning-900/30 border border-warning-500/50 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning-400" />
          <div className="text-warning-200 text-sm">
            Settlement ini berada dalam status <strong>SUBMITTED</strong> (Waiting for Finance Approval). Data bersifat read-only.
          </div>
        </div>
      )}

      {isApproved && (
        <div className="bg-success-900/30 border border-success-500/50 p-4 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-success-400" />
          <div className="text-success-200 text-sm">
            Settlement <strong>APPROVED</strong> oleh Finance. Menunggu proses Posting ke Jurnal.
          </div>
        </div>
      )}

      {isPosted && (
        <div className="bg-primary-900/30 border border-primary-500/50 p-4 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-primary-400" />
          <div className="text-primary-200 text-sm">
            Settlement telah <strong>POSTED</strong>. Transaksi jurnal terkait telah dicatat.
          </div>
        </div>
      )}

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-6">
            <p className="text-sm text-gray-400 font-medium">CASH ADVANCE</p>
            <p className="text-3xl font-bold text-gray-100 mt-2">{formatCurrency(settlement.total_advance)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Dana Disburse</p>
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-6">
            <p className="text-sm text-gray-400 font-medium">ACTUAL EXPENSE</p>
            <p className="text-3xl font-bold text-gray-100 mt-2">{formatCurrency(settlement.total_expense)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Biaya Diakui</p>
          </div>
        </Card>
        <Card className={`border ${isSurplus ? 'bg-warning-900/20 border-warning-500/30' : isDeficit ? 'bg-danger-900/20 border-danger-500/30' : 'bg-success-900/20 border-success-500/30'}`}>
          <div className="p-6">
            <p className="text-sm text-gray-400 font-medium">DIFFERENCE</p>
            <p className={`text-3xl font-bold mt-2 ${isSurplus ? 'text-warning-400' : isDeficit ? 'text-danger-400' : 'text-success-400'}`}>
              {formatCurrency(Math.abs(diff))}
            </p>
            <p className="text-sm font-medium mt-1">
              {isBalanced && <span className="text-success-400">Fully Settled</span>}
              {isSurplus && <span className="text-warning-400">Unused Advance — Amount to be Returned</span>}
              {isDeficit && <span className="text-danger-400">Reimbursement Required</span>}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200">B. Cash Advance Information</h3>
            </CardHeader>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <div className="text-gray-500">Advance No</div>
                <div className="font-medium text-gray-200">{settlement.advance_no}</div>
              </div>
              <div>
                <div className="text-gray-500">Scope</div>
                <div className="font-medium text-gray-200">{settlement.advance_scope}</div>
              </div>
              {settlement.job_order_id && (
                <div>
                  <div className="text-gray-500">Job Order ID</div>
                  <div className="font-medium text-gray-200">{settlement.job_order_id}</div>
                </div>
              )}
              {settlement.operation_id && (
                <div>
                  <div className="text-gray-500">Operation ID</div>
                  <div className="font-medium text-gray-200">{settlement.operation_id}</div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200">E. Notes</h3>
            </CardHeader>
            <div className="p-4 space-y-3">
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-primary-500 focus:border-primary-500"
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isDraft}
                placeholder="Tambahkan catatan settlement..."
              />
              {isDraft && hasPermission('settlement.edit') && (
                <Button variant="secondary" className="w-full" onClick={handleSaveNotes}>
                  <Save className="w-4 h-4 mr-2" /> Simpan Notes
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <History className="w-4 h-4 text-primary-400" />
                Audit Timeline
              </h3>
            </CardHeader>
            <div className="p-4 space-y-4">
              {settlement.timeline && settlement.timeline.length > 0 ? (
                settlement.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative pl-4 border-l-2 border-gray-700 pb-4 last:pb-0">
                    <div className="absolute w-3 h-3 bg-primary-500 rounded-full -left-[7px] top-1"></div>
                    <div className="text-sm font-medium text-gray-200">{event.action.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(event.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • {event.actor}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">Tidak ada riwayat aktivitas</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (Expenses) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-200">C. Expense Reconciliation</h3>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3">Cost Type</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    {isDraft && <th className="px-4 py-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {settlement.items && settlement.items.length > 0 ? (
                    settlement.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium">{item.cost_type}</td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3">{new Date(item.transaction_date).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.settled_amount)}</td>
                        {isDraft && (
                          <td className="px-4 py-3 text-center">
                            <button
                              disabled={isProcessing}
                              onClick={() => handleToggleItem({ id: item.operation_cost_id }, true, item.id)}
                              className="text-danger-400 hover:text-danger-300 disabled:opacity-50 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isDraft ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                        Belum ada biaya yang dimasukkan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {isDraft && (
            <Card>
              <CardHeader className="border-b border-gray-700">
                <h3 className="font-medium text-gray-200">Biaya Tersedia (Eligible Costs)</h3>
                <p className="text-xs text-gray-400 mt-1">Biaya operasi yang sudah APPROVED dan belum di-settle.</p>
              </CardHeader>
              <div className="p-0 overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3">Cost Type</th>
                      <th className="px-4 py-3">Deskripsi</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {eligibleCosts.length > 0 ? (
                      eligibleCosts.map((cost) => {
                        const isLoadingCost = isProcessing && processingCostId === cost.id;
                        return (
                          <tr key={cost.id} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-center">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleToggleItem(cost, false)}
                                className="p-1 rounded bg-gray-700 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {isLoadingCost ? <span className="w-4 h-4 inline-block border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Plus className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-medium">{cost.cost_type}</td>
                            <td className="px-4 py-3">{cost.description}</td>
                            <td className="px-4 py-3">{new Date(cost.transaction_date).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(cost.amount)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          Tidak ada biaya tambahan yang tersedia
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Submit Settlement?</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Submit Settlement ini ke Finance? <br/><br/>
              Setelah di-submit:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Operation Costs menjadi read-only.</li>
                <li>Settlement tidak dapat diubah lagi oleh Operasional.</li>
                <li>Proses approval dilanjutkan oleh tim Finance.</li>
              </ul>
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)} disabled={isProcessing}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? 'Memproses...' : 'Ya, Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Posting Modal */}
      {showPostingModal && (
        <SettlementPostingModal
          settlement={settlement}
          onClose={() => setShowPostingModal(false)}
          onSuccess={(trxId) => {
            setShowPostingModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
