import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export default function VendorInvoiceApprovalModal({ 
  isOpen, 
  onClose, 
  vendorInvoiceId, 
  onApprove, 
  onReject 
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && vendorInvoiceId) {
      fetchDetail();
    }
  }, [isOpen, vendorInvoiceId]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/vendor-invoices/${vendorInvoiceId}`);
      setData(res.data.data);
    } catch (error) {
      showError('Gagal memuat detail vendor invoice');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // We need active mappings for all items to be true. Let's assume backend resolves this, 
  // but if we don't have it in the UI, we just check if it's SUBMITTED and items exist.
  // Actually, backend resolves mapping_active in some endpoints. If not, the backend approval will block it.
  
  const isCreatorOrSubmitter = data && user && (data.created_by === user.id || data.submitted_by === user.id);
  const hasItems = data?.items?.length > 0;
  
  const totalAmount = parseFloat(data?.total_amount || 0);
  
  const dueDate = new Date(data?.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let dueStatus = 'NORMAL';
  if (dueDate < today) {
    dueStatus = 'OVERDUE';
  } else {
    const diffTime = Math.abs(dueDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 7) dueStatus = 'DUE_SOON';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approval Vendor Invoice: ${data?.ap_invoice_no || '...'}`}
      maxWidth="max-w-4xl"
    >
      {isLoading ? (
        <div className="p-12 flex justify-center items-center flex-col text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-sky-500" />
          <p>Memuat detail invoice...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Informasi Invoice
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">AP Invoice No</span>
                  <span className="font-mono text-white">{data.ap_invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendor Ref No</span>
                  <span className="font-mono text-white">{data.vendor_invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Date</span>
                  <span className="text-white">{new Date(data.invoice_date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date</span>
                  <span className="text-white">
                    {new Date(data.due_date).toLocaleDateString('id-ID')}
                    {dueStatus === 'OVERDUE' && <Badge variant="danger" className="ml-2">Overdue</Badge>}
                    {dueStatus === 'DUE_SOON' && <Badge variant="warning" className="ml-2">Due Soon</Badge>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge variant="info">{data.status}</Badge>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Informasi Vendor</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendor Name</span>
                  <span className="text-white font-medium">{data.vendor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendor Code</span>
                  <span className="font-mono text-slate-300">{data.vendor_code}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700/50 mt-2 pt-2">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono text-slate-300">Rp {Number(data.subtotal).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax</span>
                  <span className="font-mono text-slate-300">Rp {Number(data.tax_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-semibold mt-1">
                  <span className="text-slate-300">Total Tagihan</span>
                  <span className="font-mono text-amber-400 text-base">Rp {Number(totalAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Rincian Item (Operation Costs)</h3>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400">
                  <tr>
                    <th className="py-2 px-4">Ref/Job</th>
                    <th className="py-2 px-4">Cost Type</th>
                    <th className="py-2 px-4">Expense Account</th>
                    <th className="py-2 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-4">
                        <div className="text-xs text-slate-400">{item.job_order_number || '-'}</div>
                        <div className="text-sky-400 font-medium">{item.reference_no}</div>
                      </td>
                      <td className="py-2 px-4">
                        {item.cost_type}
                      </td>
                      <td className="py-2 px-4 text-xs">
                        {item.expense_account_code_snapshot ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-slate-300">{item.expense_account_code_snapshot}</span>
                            <span className="text-slate-500">{item.expense_account_name_snapshot}</span>
                          </div>
                        ) : (
                          <span className="text-amber-500 italic">Unmapped/Pending</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-medium text-white">
                        Rp {Number(item.invoice_amount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {(!data.items || data.items.length === 0) && (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-500 italic">
                        Tidak ada item dalam invoice ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">APPROVAL READINESS</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {isCreatorOrSubmitter ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <span className={isCreatorOrSubmitter ? 'text-rose-400' : 'text-emerald-400'}>
                  {isCreatorOrSubmitter 
                    ? 'Segregation of Duties: Anda adalah pembuat/pengaju invoice ini'
                    : 'Segregation of Duties: Memenuhi syarat'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {hasItems ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className={hasItems ? 'text-emerald-400' : 'text-rose-400'}>
                  {hasItems 
                    ? 'Terdapat rincian item tagihan' 
                    : 'Tidak ada rincian item, tidak dapat diproses'}
                </span>
              </div>
              
              {/* Not doing mapping check here as it's backend authoritative */}
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-400">Account Mapping akan diverifikasi secara authoritative oleh sistem saat persetujuan</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            
            <Button 
              variant="danger" 
              onClick={() => {
                onClose();
                onReject(data);
              }}
              disabled={isCreatorOrSubmitter}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Tolak
            </Button>
            
            <Button 
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => {
                onClose();
                onApprove(data.id);
              }}
              disabled={!hasItems || isCreatorOrSubmitter}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Setujui Invoice
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-rose-400">Data tidak ditemukan</div>
      )}
    </Modal>
  );
}
