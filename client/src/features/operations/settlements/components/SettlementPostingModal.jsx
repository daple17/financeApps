import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import settlementService from '../../../../services/settlementService';
import { useToast } from '../../../../context/ToastContext';

export default function SettlementPostingModal({ settlement, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [cashAccounts, setCashAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [preview, setPreview] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const diff = Number(settlement.difference) || 0;
  const needsCashAccount = Math.abs(diff) > 0.01;

  useEffect(() => {
    if (needsCashAccount) {
      fetchCashAccounts();
    } else {
      handleGeneratePreview();
    }
  }, []);

  const fetchCashAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const api = require('../../../../services/api').default;
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
    if (needsCashAccount && !selectedAccountId) {
      setErrorMsg('Pilih akun Kas/Bank terlebih dahulu');
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const res = await settlementService.postingPreview(settlement.id, selectedAccountId);
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
    if (needsCashAccount && !selectedAccountId) return;
    setIsPosting(true);
    try {
      const res = await settlementService.postSettlement(settlement.id, selectedAccountId);
      showSuccess(res.message || 'Settlement berhasil diposting');
      onSuccess(res.data?.transaction_id);
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal posting settlement');
    } finally {
      setIsPosting(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-gray-100">Posting Settlement: {settlement.settlement_no}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
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

          {needsCashAccount && (
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-gray-200 mb-2">Penyelesaian Selisih Kas</h3>
              <p className="text-sm text-gray-400 mb-4">
                Terdapat selisih {diff > 0 ? 'sisa uang muka' : 'reimbursement'} sebesar <span className="font-medium text-white">{formatCurrency(Math.abs(diff))}</span>.
                Pilih akun {diff > 0 ? 'Penerimaan (Debit Kas/Bank)' : 'Pengeluaran (Kredit Kas/Bank)'}.
              </p>
              
              <div className="flex gap-3">
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    setPreview(null);
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                  disabled={isLoadingAccounts || isPosting}
                >
                  <option value="">-- Pilih Akun Kas/Bank --</option>
                  {cashAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
                <Button 
                  onClick={handleGeneratePreview} 
                  disabled={!selectedAccountId || isGenerating || isPosting}
                  variant="secondary"
                >
                  {isGenerating ? 'Memuat...' : 'Preview Jurnal'}
                </Button>
              </div>
            </div>
          )}

          {preview && (
            <div>
              <h3 className="font-semibold text-gray-200 mb-3">Preview Jurnal</h3>
              <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 bg-gray-900/50 uppercase border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3">Kode Akun</th>
                      <th className="px-4 py-3">Nama Akun</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {preview.journalEntries.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-mono text-xs">{entry.accountCode}</td>
                        <td className="px-4 py-3">{entry.accountName}</td>
                        <td className="px-4 py-3 text-right">{entry.type === 'DEBIT' ? formatCurrency(entry.amount) : '-'}</td>
                        <td className="px-4 py-3 text-right">{entry.type === 'CREDIT' ? formatCurrency(entry.amount) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-900/80 font-bold border-t border-gray-700 text-white">
                    <tr>
                      <td colSpan="2" className="px-4 py-3 text-right">TOTAL</td>
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
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900 rounded-b-xl">
          <Button variant="secondary" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button 
            variant="primary" 
            onClick={handlePost} 
            disabled={!preview || isPosting}
          >
            {isPosting ? 'Memposting...' : 'Posting Settlement'}
          </Button>
        </div>

      </div>
    </div>
  );
}
