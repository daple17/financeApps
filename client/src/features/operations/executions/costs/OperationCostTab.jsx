import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, CheckCircle, Send, Wallet, AlertCircle } from 'lucide-react';
import operationCostService from '../../../../services/operationCostService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { Card, CardHeader } from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import CostFormModal, { COST_TYPES } from './CostFormModal';

export default function OperationCostTab({ operationId, jobOrderId }) {
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [costs, setCosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  
  // Action context
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    fetchData();
  }, [operationId, jobOrderId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [costsRes, summaryRes] = await Promise.all([
        operationCostService.getByOperationId(operationId),
        jobOrderId ? operationCostService.getCostSummary(jobOrderId) : Promise.resolve({ data: null })
      ]);
      
      if (costsRes.status === 'success') {
        setCosts(costsRes.data);
      }
      
      if (summaryRes.status === 'success' && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      showError('Gagal memuat data biaya operasional');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="default">DRAFT</Badge>;
      case 'SUBMITTED': return <Badge variant="warning">SUBMITTED</Badge>;
      case 'REJECTED': return <Badge variant="danger">REJECTED</Badge>;
      case 'APPROVED': return <Badge variant="success">APPROVED</Badge>;
      case 'POSTED': return <Badge variant="primary">POSTED</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (cost, newStatus) => {
    if (!window.confirm(`Yakin ingin Submit biaya ini?`)) return;
    
    try {
      await operationCostService.updateStatus(cost.id, newStatus);
      showSuccess(`Status berhasil diupdate menjadi ${newStatus}`);
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal mengupdate status');
    }
    setActionMenuOpen(null);
  };

  const handleDelete = async (cost) => {
    if (!window.confirm('Hapus Biaya Operasional?\n\nBiaya ini akan dihapus dari Operation. Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      await operationCostService.delete(cost.id);
      showSuccess('Biaya berhasil dihapus');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal menghapus biaya');
    }
    setActionMenuOpen(null);
  };

  // Group breakdown from summary if available, else calculate locally for UI fallback
  const breakdown = summary && summary.breakdown 
    ? summary.breakdown.reduce((acc, item) => {
        acc[item.cost_type] = Number(item.total_amount);
        return acc;
      }, {})
    : costs.reduce((acc, curr) => {
        acc[curr.cost_type] = (acc[curr.cost_type] || 0) + Number(curr.amount);
        return acc;
      }, {});

  // Summary mapping logic based on jobOrder API
  // Note: summary returned by backend groups ALL operations for the JobOrder.
  // The user wants summary for THIS operation. Wait, if there's only one operation, it's fine.
  // Actually we should aggregate locally for THIS operation specifically for DRAFT/SUBMITTED totals.
  const localTotals = costs.reduce((acc, curr) => {
    acc.total += Number(curr.amount);
    acc[curr.status] = (acc[curr.status] || 0) + Number(curr.amount);
    return acc;
  }, { total: 0, DRAFT: 0, SUBMITTED: 0, REJECTED: 0, APPROVED: 0, POSTED: 0 });

  if (isLoading) {
    return <div className="py-12 text-center text-slate-400">Loading cost data...</div>;
  }

  // Handle Unauthorized view
  if (!hasPermission('operation_cost.view')) {
    return (
      <Card>
        <div className="py-12 text-center text-slate-400 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-200">Akses Ditolak</h3>
          <p className="mt-2 text-sm max-w-md">Anda tidak memiliki izin untuk melihat informasi biaya operasional.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-16 h-16 text-sky-500" />
          </div>
          <p className="text-xs text-slate-400 font-medium mb-1">TOTAL OPERATION COST</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(localTotals.total)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">DRAFT</p>
          <p className="text-xl font-semibold text-slate-300">{formatCurrency(localTotals.DRAFT)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">SUBMITTED</p>
          <p className="text-xl font-semibold text-amber-400">{formatCurrency(localTotals.SUBMITTED)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">REJECTED</p>
          <p className="text-xl font-semibold text-rose-400">{formatCurrency(localTotals.REJECTED)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">APPROVED</p>
          <p className="text-xl font-semibold text-emerald-400">{formatCurrency(localTotals.APPROVED + localTotals.POSTED)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Cost Records</h3>
            {hasPermission('operation_cost.create') && (
              <Button variant="primary" onClick={() => {
                setEditingCost(null);
                setShowForm(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Biaya
              </Button>
            )}
          </div>

          <Card>
            {costs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center">
                <Wallet className="w-12 h-12 mb-3 text-slate-600" />
                <h3 className="text-lg font-medium text-slate-200">Belum ada biaya operasional</h3>
                <p className="mt-2 text-sm max-w-md">Tambahkan biaya yang terjadi selama pelaksanaan Operation ini.</p>
                {hasPermission('operation_cost.create') && (
                  <Button variant="primary" className="mt-6" onClick={() => {
                    setEditingCost(null);
                    setShowForm(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Biaya
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Cost Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((cost) => (
                      <tr key={cost.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {COST_TYPES[cost.cost_type] || cost.cost_type}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <div className="line-clamp-2" title={cost.description}>{cost.description}</div>
                          {cost.reference_no && <div className="text-xs text-slate-500 mt-0.5">Ref: {cost.reference_no}</div>}
                          {cost.status === 'REJECTED' && cost.rejection_reason && (
                            <div className="text-xs text-rose-400 mt-1 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{cost.rejection_reason}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{cost.vendor_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {cost.transaction_date ? new Date(cost.transaction_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-sky-400 text-right">
                          {formatCurrency(cost.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(cost.status)}
                        </td>
                        <td className="px-4 py-3 text-center relative">
                          <button 
                            onClick={() => setActionMenuOpen(actionMenuOpen === cost.id ? null : cost.id)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Actions */}
                          {actionMenuOpen === cost.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                              <div className="absolute right-8 top-8 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                {cost.status === 'DRAFT' && (
                                  <>
                                    {hasPermission('operation_cost.edit') && (
                                      <button 
                                        onClick={() => {
                                          setEditingCost(cost);
                                          setShowForm(true);
                                          setActionMenuOpen(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center"
                                      >
                                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                                      </button>
                                    )}
                                    {hasPermission('operation_cost.submit') && (
                                      <button 
                                        onClick={() => handleUpdateStatus(cost, 'SUBMITTED')}
                                        className="w-full text-left px-4 py-2 text-sm text-sky-400 hover:bg-slate-800 flex items-center"
                                      >
                                        <Send className="w-4 h-4 mr-2" /> Submit
                                      </button>
                                    )}
                                    {hasPermission('operation_cost.delete') && (
                                      <button 
                                        onClick={() => handleDelete(cost)}
                                        className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-slate-800 flex items-center"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                      </button>
                                    )}
                                  </>
                                )}
                                
                                {cost.status === 'REJECTED' && hasPermission('operation_cost.edit') && (
                                  <button 
                                    onClick={() => {
                                      setEditingCost(cost);
                                      setShowForm(true);
                                      setActionMenuOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center"
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" /> Edit (Revise)
                                  </button>
                                )}

                                {['SUBMITTED', 'APPROVED', 'POSTED'].includes(cost.status) && (
                                  <div className="px-4 py-2 text-xs text-slate-500 text-center italic">
                                    No actions available
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Cost Breakdown</h3>
          <Card>
            <div className="p-4 space-y-4">
              {Object.keys(breakdown).length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Tidak ada data breakdown</p>
              ) : (
                Object.entries(breakdown).map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">{COST_TYPES[type] || type}</span>
                    <span className="text-sm font-medium text-white">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {showForm && (
        <CostFormModal 
          operationId={operationId}
          existingCost={editingCost}
          onClose={() => {
            setShowForm(false);
            setEditingCost(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCost(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
