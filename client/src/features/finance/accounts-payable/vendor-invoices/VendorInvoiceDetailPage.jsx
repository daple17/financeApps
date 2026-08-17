import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, Send, Trash2, CheckCircle, Clock, FileText, Banknote, History, Receipt, XCircle, RefreshCw } from 'lucide-react';
import { getVendorInvoiceById, submitInvoice, reviseInvoice } from '../../../../services/vendorInvoiceService';
import VendorInvoicePostingModal from './components/VendorInvoicePostingModal';
import VendorPaymentModal from '../vendor-payments/components/VendorPaymentModal';
import { useToast } from '../../../../context/ToastContext';
import { Card, CardHeader } from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { useAuth } from '../../../../context/AuthContext';

export default function VendorInvoiceDetailPage() {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await getVendorInvoiceById(id);
      if (res.status === 'success') {
        setInvoice(res.data);
      }
    } catch (err) {
      showError('Gagal memuat Vendor Invoice');
      navigate('/vendor-invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleSubmit = async () => {
    if (!window.confirm('Submit Vendor Invoice ini ke Finance?')) return;
    setIsProcessing(true);
    try {
      await submitInvoice(id);
      showSuccess('Vendor Invoice berhasil disubmit');
      fetchInvoice();
    } catch (err) {
      showError('Gagal submit invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevise = async () => {
    if (!window.confirm('Revisi Vendor Invoice ini kembali menjadi DRAFT?')) return;
    setIsProcessing(true);
    try {
      await reviseInvoice(id);
      showSuccess('Vendor Invoice dikembalikan ke status DRAFT');
      fetchInvoice();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal merevisi invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);
  };

  if (isLoading || !invoice) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Memuat data...</div>;
  }

  const isDraft = invoice.status === 'DRAFT';
  const isSubmitted = invoice.status === 'SUBMITTED';
  const isRejected = invoice.status === 'REJECTED';
  const isApproved = invoice.status === 'APPROVED';
  const isPosted = invoice.status === 'POSTED';
  const isPaid = invoice.status === 'PAID';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {isRejected && invoice.rejection_reason && (
        <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 flex gap-3 items-start">
          <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-rose-400">Vendor Invoice Ditolak</h4>
            <p className="text-sm text-rose-300 mt-1">{invoice.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/vendor-invoices')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6 text-sky-400" />
                {invoice.ap_invoice_no}
              </h1>
              <Badge variant={isDraft ? 'default' : isSubmitted ? 'warning' : isRejected ? 'danger' : 'success'}>
                {invoice.status}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">Vendor Invoice Detail</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          {isDraft && (
            <>
              <Button variant="outline" onClick={() => navigate(`/vendor-invoices/${invoice.id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="primary" className="bg-sky-600 hover:bg-sky-500" onClick={handleSubmit} disabled={isProcessing}>
                <Send className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-pulse' : ''}`} />
                Submit to Finance
              </Button>
            </>
          )}
          {isRejected && (
            <Button variant="primary" className="bg-amber-600 hover:bg-amber-500" onClick={handleRevise} disabled={isProcessing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Revisi (Kembali ke DRAFT)
            </Button>
          )}
          {isApproved && hasPermission('vendor_invoice.post') && (
            <Button variant="success" onClick={() => setShowPostingModal(true)}>
              <Send className="w-4 h-4 mr-2" /> Posting Jurnal
            </Button>
          )}
          {isPosted && hasPermission('vendor_payment.create') && (
            <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => setShowPaymentModal(true)}>
              <Banknote className="w-4 h-4 mr-2" /> Bayar Invoice
            </Button>
          )}
          {(isPosted || isPaid) && invoice.transaction_id && (
            <Button variant="outline" onClick={() => window.open(`/finance-transactions/${invoice.transaction_id}`, '_blank')}>
              <FileText className="w-4 h-4 mr-2" /> Lihat Jurnal Hutang
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          
          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Invoice Information
              </h3>
            </CardHeader>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Nomor AP</div>
                <div className="font-medium text-gray-200">{invoice.ap_invoice_no}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Nomor Invoice Vendor</div>
                <div className="font-medium text-gray-200">{invoice.vendor_invoice_number}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Tanggal Invoice</div>
                <div className="font-medium text-gray-200">
                  {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Jatuh Tempo</div>
                <div className="font-medium text-gray-200">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
              {invoice.notes && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Catatan</div>
                  <div className="font-medium text-gray-200 whitespace-pre-wrap">{invoice.notes}</div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Vendor Information
              </h3>
            </CardHeader>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Nama Vendor</div>
                <div className="font-medium text-gray-200">{invoice.vendor_name || 'Vendor Tidak Ditemukan'}</div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                Financial Summary
              </h3>
            </CardHeader>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Number of Costs</span>
                <span className="font-medium text-gray-200">{(invoice.items || []).length} Costs</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Subtotal</span>
                <span className="font-medium text-gray-200">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Tax</span>
                <span className="font-medium text-gray-200">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-300 font-semibold">Total</span>
                <span className="text-emerald-400 font-bold text-lg">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </Card>

          {/* Traceability Placeholders */}
          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Financial Traceability
              </h3>
            </CardHeader>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 border-dashed text-center">
                <div className="text-gray-400 text-xs uppercase font-medium tracking-wider mb-1">Finance Transaction</div>
                {invoice.transaction_id ? (
                  <div className="text-sky-400 font-medium">{invoice.transaction_id}</div>
                ) : (
                  <div className="text-gray-500 text-sm italic">Belum diposting</div>
                )}
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 border-dashed text-center">
                <div className="text-gray-400 text-xs uppercase font-medium tracking-wider mb-1">Vendor Payment</div>
                <div className="text-gray-500 text-sm italic">Menunggu Pembayaran</div>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Linked Operation Costs
              </h3>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3">Operation No</th>
                    <th className="px-4 py-3">Job Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Cost Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-sky-400">{item.operation_no || '-'}</td>
                        <td className="px-4 py-3">{item.job_order_number || '-'}</td>
                        <td className="px-4 py-3">{item.customer_name || '-'}</td>
                        <td className="px-4 py-3">{item.cost_type}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(item.invoice_amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        Belum ada cost yang dipilih
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-700">
              <h3 className="font-medium text-gray-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Audit Timeline
              </h3>
            </CardHeader>
            <div className="p-4 space-y-4">
              {invoice.timeline && invoice.timeline.length > 0 ? (
                invoice.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative pl-4 border-l-2 border-gray-700 pb-4 last:pb-0">
                    <div className="absolute w-3 h-3 bg-sky-500 rounded-full -left-[7px] top-1"></div>
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
      </div>

      {showPostingModal && (
        <VendorInvoicePostingModal
          invoice={invoice}
          onClose={() => setShowPostingModal(false)}
          onSuccess={() => {
            setShowPostingModal(false);
            fetchInvoice();
          }}
        />
      )}

      {showPaymentModal && (
        <VendorPaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchInvoice();
          }}
        />
      )}
    </div>
  );
}
