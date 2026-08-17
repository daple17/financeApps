import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { vendorPaymentApi } from '../../../../../services/vendorPaymentApi';
import { useToast } from '../../../../../context/ToastContext';

export default function VendorPaymentModal({ invoice, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [cashAccounts, setCashAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchCashAccounts();
  }, []);

  const fetchCashAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const api = require('../../../../../services/api').default;
      const res = await api.get('/coa/cash-bank-accounts');
      if (res.data.status === 'success') {
        setCashAccounts(res.data.data);
      }
    } catch (err) {
      setErrorMsg('Gagal memuat daftar akun Kas/Bank');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedAccountId) {
      setErrorMsg('Pilih akun Kas/Bank terlebih dahulu');
      return;
    }
    if (!paymentDate) {
      setErrorMsg('Pilih tanggal pembayaran');
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const payload = {
        invoiceId: invoice.id,
        cashAccountId: selectedAccountId,
        paymentDate,
        notes
      };
      const res = await vendorPaymentApi.previewPayment(payload);
      if (res.status === 'success') {
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
    if (!window.confirm('Proses pembayaran ini sekarang? Aksi ini tidak dapat dibatalkan.')) return;
    
    setIsPosting(true);
    try {
      const payload = {
        invoiceId: invoice.id,
        cashAccountId: selectedAccountId,
        paymentDate,
        notes
      };
      await vendorPaymentApi.createPayment(payload);
      showSuccess('Pembayaran Vendor Invoice berhasil diproses');
      onSuccess();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal memproses pembayaran');
      setIsPosting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Proses Pembayaran Invoice</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Payment Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pilih Akun Kas/Bank <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-sky-500"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={isLoadingAccounts || isGenerating}
              >
                <option value="">-- Pilih Akun --</option>
                {cashAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>
            
            <Input
              label="Tanggal Pembayaran"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              disabled={isGenerating}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Catatan Pembayaran (Opsional)
              </label>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-sky-500"
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isGenerating}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleGeneratePreview}
              disabled={isGenerating || !selectedAccountId}
            >
              {isGenerating ? 'Generating...' : 'Preview Jurnal Pembayaran'}
            </Button>
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="space-y-4 pt-4 border-t border-gray-700 animate-in fade-in duration-300">
              <h3 className="text-md font-medium text-gray-200">Preview Finance Transaction</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Total Pembayaran</div>
                  <div className="text-lg font-semibold text-green-400">
                    {formatCurrency(preview.amount)}
                  </div>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Deskripsi</div>
                  <div className="text-sm text-gray-300">{preview.description}</div>
                </div>
              </div>

              <h4 className="text-sm font-medium text-gray-300 mb-2">Jurnal Entries:</h4>
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="bg-gray-800/50 text-xs uppercase border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3">Akun</th>
                      <th className="px-4 py-3 text-right text-emerald-400">Debit</th>
                      <th className="px-4 py-3 text-right text-rose-400">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {preview.journalEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-200">{entry.accountName}</div>
                          <div className="text-xs text-gray-500">{entry.accountCode}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {entry.type === 'DEBIT' ? formatCurrency(entry.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {entry.type === 'CREDIT' ? formatCurrency(entry.amount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-800/30 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-right text-gray-400">Total:</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(preview.amount)}</td>
                      <td className="px-4 py-3 text-right text-rose-400">{formatCurrency(preview.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
          <Button variant="secondary" onClick={onClose} disabled={isPosting}>
            Batal
          </Button>
          <Button
            variant="success"
            onClick={handlePost}
            disabled={!preview || isPosting}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Send className="w-4 h-4 mr-2" />
            {isPosting ? 'Memproses...' : 'Proses Pembayaran'}
          </Button>
        </div>
      </div>
    </div>
  );
}
