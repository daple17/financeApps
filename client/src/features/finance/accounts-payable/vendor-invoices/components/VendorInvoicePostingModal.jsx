import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { getPostingPreview, postLiability } from '../../../../../../services/vendorInvoiceService';
import { useToast } from '../../../../../../context/ToastContext';

export default function VendorInvoicePostingModal({ invoice, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    handleGeneratePreview();
  }, []);

  const handleGeneratePreview = async () => {
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const res = await getPostingPreview(invoice.id);
      if (res.status === 'success') {
        // We need to resolve account codes/names from the preview if they were just IDs, 
        // wait, getPostingPreview from backend returned just accountId in journalEntries.
        // Actually, we should map them or let the backend return the code/name.
        // For now, assume backend returns what we have. If not, it just shows ID. 
        setPreview(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal generate preview jurnal');
      setPreview(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    setIsPosting(true);
    try {
      const res = await postLiability(invoice.id);
      showSuccess(res.message || 'Vendor Invoice berhasil diposting');
      onSuccess(res.data?.transactionId);
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal memposting Vendor Invoice');
    } finally {
      setIsPosting(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">Posting Jurnal Hutang: {invoice.ap_invoice_no}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 bg-rose-950/40 border border-rose-900 rounded-lg p-3 flex gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isGenerating && (
            <div className="text-center p-8 text-slate-400 animate-pulse">Memuat Preview Jurnal...</div>
          )}

          {!isGenerating && preview && (
            <div>
              <h3 className="font-semibold text-slate-200 mb-3">Preview Jurnal</h3>
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Account ID</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {preview.journalEntries.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">
                          {entry.accountCode || entry.accountId} 
                          {entry.accountName && <span className="text-slate-400 block truncate">{entry.accountName}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">{entry.type === 'DEBIT' ? formatCurrency(entry.amount) : '-'}</td>
                        <td className="px-4 py-3 text-right">{entry.type === 'CREDIT' ? formatCurrency(entry.amount) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900/80 font-bold border-t border-slate-700 text-white">
                    <tr>
                      <td className="px-4 py-3 text-right">TOTAL</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(preview.amount)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(preview.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-xl">
          <Button variant="secondary" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button 
            variant="primary" 
            onClick={handlePost} 
            disabled={!preview || isPosting || isGenerating}
          >
            {isPosting ? 'Memposting...' : 'Posting Jurnal'}
          </Button>
        </div>

      </div>
    </div>
  );
}
