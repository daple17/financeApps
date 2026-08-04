import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import settlementService from '../../../services/settlementService';
import { useToast } from '../../../context/ToastContext';

export default function SettlementApprovalModal({ 
  isOpen, 
  onClose, 
  settlementId, 
  onApprove, 
  onReject 
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen && settlementId) {
      fetchDetail();
    }
  }, [isOpen, settlementId]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await settlementService.getById(settlementId);
      setData(res.data);
    } catch (error) {
      showError('Gagal memuat detail settlement');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalAdvance = parseFloat(data?.total_advance || 0);
  const totalExpense = parseFloat(data?.total_expense || 0);
  const difference = parseFloat(data?.difference || 0);
  
  const hasInactiveOrMissingMapping = data?.items?.some(item => !item.mapping_active || !item.account_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approval Settlement: ${data?.settlement_no || '...'}`}
      maxWidth="max-w-4xl"
    >
      {isLoading ? (
        <div className="p-12 flex justify-center items-center flex-col text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-sky-500" />
          <p>Memuat detail rekonsiliasi...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Informasi Settlement
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">No Settlement</span>
                  <span className="font-mono text-white">{data.settlement_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal</span>
                  <span className="text-white">{new Date(data.settlement_date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge variant="info">{data.status}</Badge>
                </div>
                {data.notes && (
                  <div className="pt-2 border-t border-slate-700/50 mt-2">
                    <span className="block text-slate-400 mb-1">Catatan:</span>
                    <p className="text-white text-xs italic">{data.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Informasi Cash Advance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">No Advance</span>
                  <span className="font-mono text-white">{data.advance_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scope</span>
                  <Badge variant="secondary">{data.advance_scope}</Badge>
                </div>
                <div className="flex justify-between border-t border-slate-700/50 mt-2 pt-2">
                  <span className="text-slate-400">Total Pencairan</span>
                  <span className="font-mono font-bold text-amber-400">
                    Rp {totalAdvance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-300 p-4 border-b border-slate-700/50">
              Rincian Biaya (Expense Items)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Cost Type & Keterangan</th>
                    <th className="px-4 py-3">Expense Account Mapping</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {data.items?.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-slate-500 italic">
                        Tidak ada rincian biaya.
                      </td>
                    </tr>
                  ) : (
                    data.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/60">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{item.cost_type}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[250px]">{item.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          {!item.account_id || !item.mapping_active ? (
                            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-400/10 px-2 py-1 rounded text-xs w-max">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {item.account_id ? 'Mapping Inactive' : 'Missing Mapping'}
                            </div>
                          ) : (
                            <div>
                              <div className="font-mono text-xs text-emerald-400">{item.account_code}</div>
                              <div className="text-xs text-slate-300">{item.account_name}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white">
                          Rp {parseFloat(item.settled_amount).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Expense</div>
              <div className="text-xl font-mono font-bold text-sky-400">
                Rp {totalExpense.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                {difference > 0 ? 'Unused Advance (Kembalikan)' : difference < 0 ? 'Reimbursement Required (Kurang)' : 'Fully Settled'}
              </div>
              <div className={`text-xl font-mono font-bold ${difference === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Rp {Math.abs(difference).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          
          {hasInactiveOrMissingMapping && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Terdapat Cost Type yang tidak memiliki Expense Account aktif. Approval akan ditolak oleh sistem. Kembalikan ke DRAFT untuk diperbaiki oleh Operasional.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-700/50">
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                onClose();
                onReject(data);
              }}
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Tolak
            </Button>
            <Button 
              variant="primary"
              disabled={hasInactiveOrMissingMapping}
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => {
                onClose();
                onApprove(data.id);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Setujui
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
