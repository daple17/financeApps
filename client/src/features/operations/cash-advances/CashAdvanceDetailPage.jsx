import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Trash2, Send, Wallet, 
  FileText, Clock, User, Briefcase, MapPin, AlignLeft, Receipt, History
} from 'lucide-react';
import { getCashAdvanceById, deleteCashAdvance, submitCashAdvance } from '../../../services/cashAdvanceService';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

export default function CashAdvanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [advance, setAdvance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [operationContext, setOperationContext] = useState(null);
  const [jobOrderContext, setJobOrderContext] = useState(null);

  // Disbursement state
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [disburseForm, setDisburseForm] = useState({
    source_account_id: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isDisbursing, setIsDisbursing] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await getCashAdvanceById(id);
      if (res.status === 'success') {
        const data = res.data;
        setAdvance(data);
        
        // Fetch contexts
        if (data.operation_id) {
           api.get(`/operations/${data.operation_id}`).then(r => setOperationContext(r.data.data)).catch(()=>{});
        }
        if (data.job_order_id && data.advance_scope === 'JOB_ORDER') {
           api.get(`/job-orders/${data.job_order_id}`).then(r => setJobOrderContext(r.data.data)).catch(()=>{});
        }
      }
    } catch (err) {
      showError('Gagal memuat detail Cash Advance');
      navigate('/cash-advances');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Hapus Cash Advance?\n\n${advance.advance_no} akan dihapus.\nTindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteCashAdvance(id);
        showSuccess('Cash Advance berhasil dihapus');
        navigate('/cash-advances');
      } catch (err) {
        showError(err.response?.data?.message || 'Gagal menghapus Cash Advance');
      }
    }
  };

  const handleSubmit = async () => {
    if (window.confirm("Submit Cash Advance?\n\nSetelah disubmit, request tidak dapat diedit hingga diproses lebih lanjut.")) {
      try {
        await submitCashAdvance(id);
        showSuccess('Cash Advance berhasil disubmit');
        fetchDetail(); // Refresh data
      } catch (err) {
        showError(err.response?.data?.message || 'Gagal mensubmit Cash Advance');
      }
    }
  };

  const handleOpenDisburseModal = async () => {
    try {
      const res = await api.get('/cash-advances/eligible-source-accounts');
      setSourceAccounts(res.data.data || []);
      setIsDisburseModalOpen(true);
    } catch (err) {
      showError('Gagal memuat daftar akun Kas/Bank');
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!disburseForm.source_account_id) {
      showError('Akun Kas/Bank sumber wajib dipilih');
      return;
    }
    if (!window.confirm(`Proses pencairan dana sebesar ${formatCurrency(advance.amount)}?`)) return;

    setIsDisbursing(true);
    try {
      const res = await api.post(`/cash-advances/${id}/disburse`, disburseForm);
      showSuccess(res.data.message || 'Pencairan berhasil dicatat');
      setIsDisburseModalOpen(false);
      fetchDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal melakukan pencairan');
    } finally {
      setIsDisbursing(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Memuat detail...</div>;
  }

  if (!advance) {
    return <div className="p-12 text-center text-slate-400">Cash Advance tidak ditemukan</div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="default">Draft</Badge>;
      case 'SUBMITTED': return <Badge variant="warning">Submitted</Badge>;
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      case 'DISBURSED': return <Badge variant="primary">Disbursed</Badge>;
      case 'SETTLED': return <Badge variant="success">Settled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getScopeBadge = (scope) => {
    switch (scope) {
      case 'OPERATION': return <Badge variant="primary">Operation</Badge>;
      case 'JOB_ORDER': return <Badge variant="info">Job Order</Badge>;
      case 'GENERAL': return <Badge variant="default">General</Badge>;
      default: return <Badge variant="default">{scope}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isDraft = advance.status === 'DRAFT';
  const isApproved = advance.status === 'APPROVED';
  const canEdit = isDraft && hasPermission('cash_advance.edit');
  const canDelete = isDraft && hasPermission('cash_advance.delete');
  const canSubmit = isDraft && hasPermission('cash_advance.submit');
  const canDisburse = isApproved && hasPermission('cash_advance.disburse');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/cash-advances')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {advance.advance_no}
              </h1>
              {getStatusBadge(advance.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">Detail pengajuan kas bon operasional</p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/cash-advances/${id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          {canSubmit && (
            <Button variant="primary" onClick={handleSubmit}>
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          )}
          {canDisburse && (
            <Button variant="primary" onClick={handleOpenDisburseModal} className="bg-emerald-600 hover:bg-emerald-500">
              <Wallet className="w-4 h-4 mr-2" />
              Disburse
            </Button>
          )}
          {advance.status === 'DISBURSED' && advance.advance_scope !== 'GENERAL' && (
            !advance.settlement_id ? (
              <Button variant="primary" onClick={() => navigate('/settlements/new')} className="bg-indigo-600 hover:bg-indigo-500">
                <Receipt className="w-4 h-4 mr-2" />
                Create Settlement
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate(`/settlements/${advance.settlement_id}`)}>
                <Receipt className="w-4 h-4 mr-2" />
                View Settlement <Badge variant="default" className="ml-2 scale-75">{advance.settlement_status}</Badge>
              </Button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Informasi Request
              </h2>
            </CardHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Jumlah Request</div>
                  <div className="text-2xl font-bold text-sky-400">
                    {formatCurrency(advance.amount)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-500 mb-1">Penerima Dana</div>
                  <div className="text-lg font-medium text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-400" />
                    {advance.driver_name || advance.user_name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 ml-7">
                    {advance.driver_id ? 'Driver' : 'Internal User'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-1">Tanggal Request</div>
                  <div className="text-base text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {formatDate(advance.request_date)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-1">Scope</div>
                  <div className="text-base text-white">
                    {getScopeBadge(advance.advance_scope)}
                  </div>
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-slate-800">
                  <div className="text-sm text-slate-500 mb-1">Keperluan / Tujuan</div>
                  <div className="text-base text-white">{advance.purpose}</div>
                </div>

                {advance.notes && (
                  <div className="md:col-span-2 pt-4 border-t border-slate-800">
                    <div className="text-sm text-slate-500 mb-1">Catatan</div>
                    <div className="text-base text-white">{advance.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-400" />
                Context Referensi
              </h2>
            </CardHeader>
            <div className="p-6">
              {advance.advance_scope === 'GENERAL' && (
                <div className="text-slate-400 text-sm italic">
                  Pengajuan ini merupakan General Advance dan tidak terkait langsung dengan Job Order atau Operation.
                </div>
              )}

              {advance.advance_scope === 'JOB_ORDER' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500">Job Order No</div>
                    <div className="text-base font-medium text-white">{advance.job_order_number}</div>
                  </div>
                  {jobOrderContext && (
                    <>
                      <div>
                        <div className="text-sm text-slate-500">Customer</div>
                        <div className="text-base text-white">{jobOrderContext.customer_name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Tipe Pekerjaan</div>
                        <div className="text-base text-white">{jobOrderContext.job_order_type}</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {advance.advance_scope === 'OPERATION' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500">Operation No</div>
                    <div className="text-base font-medium text-white">{advance.operation_no}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Job Order No</div>
                    <div className="text-base text-white">{advance.job_order_number}</div>
                  </div>
                  {operationContext && (
                    <>
                      <div>
                        <div className="text-sm text-slate-500">Customer</div>
                        <div className="text-base text-white">{operationContext.customer_name}</div>
                      </div>
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <div className="text-sm text-white">{operationContext.pickup_location}</div>
                          <div className="text-xs text-slate-500">ke</div>
                          <div className="text-sm text-white">{operationContext.delivery_location}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-sky-400" />
                Meta Data
              </h2>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-slate-500">Dibuat Oleh</div>
                <div className="text-base text-white">{advance.creator_name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Dibuat Pada</div>
                <div className="text-base text-white">{formatDate(advance.created_at)}</div>
              </div>
              {advance.rejection_reason && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-sm text-slate-500">Alasan Penolakan</div>
                  <div className="text-base text-red-400 mt-1 p-3 bg-red-950/30 rounded border border-red-900/30">
                    {advance.rejection_reason}
                  </div>
                </div>
              )}
              {advance.transaction_id && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-sm text-slate-500">Disbursed At</div>
                  <div className="text-base text-white">{formatDate(advance.disbursed_at)}</div>
                  <div className="text-sm text-slate-500 mt-2">Disbursed By</div>
                  <div className="text-base text-white">{advance.disbursed_by_name || '-'}</div>
                  <div className="text-sm text-slate-500 mt-2">Finance Transaction</div>
                  <div className="text-base font-mono text-sky-400 cursor-pointer hover:underline" onClick={() => navigate(`/finance/transactions/${advance.transaction_id}`)}>
                    Lihat Transaksi
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                Audit Timeline
              </h2>
            </CardHeader>
            <div className="p-6">
              {advance.timeline && advance.timeline.length > 0 ? (
                <div className="space-y-4">
                  {advance.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative pl-4 border-l-2 border-slate-700 pb-4 last:pb-0">
                      <div className="absolute w-3 h-3 bg-sky-500 rounded-full -left-[7px] top-1"></div>
                      <div className="text-sm font-medium text-white">{event.action.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDate(event.timestamp)} • {event.actor}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm">Tidak ada riwayat aktivitas</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isDisburseModalOpen}
        onClose={() => setIsDisburseModalOpen(false)}
        title="Pencairan Cash Advance"
      >
        <form onSubmit={handleDisburse} className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Nominal Pencairan</span>
              <span className="text-lg font-bold text-sky-400">{formatCurrency(advance.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Penerima Dana</span>
              <span className="text-sm text-white">{advance.driver_name || advance.user_name}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Sumber Dana (Kas / Bank) <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
              value={disburseForm.source_account_id}
              onChange={(e) => setDisburseForm({ ...disburseForm, source_account_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Akun Sumber --</option>
              {sourceAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Tanggal Pencairan"
            type="date"
            value={disburseForm.disbursement_date}
            onChange={(e) => setDisburseForm({ ...disburseForm, disbursement_date: e.target.value })}
            required
          />

          <Input
            label="Catatan Tambahan (Opsional)"
            placeholder="Misal: Bukti transfer via BCA"
            value={disburseForm.notes}
            onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="secondary" onClick={() => setIsDisburseModalOpen(false)} disabled={isDisbursing}>
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={isDisbursing} className="bg-emerald-600 hover:bg-emerald-500">
              Proses Pencairan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
