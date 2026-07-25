import React, { useState, useEffect } from 'react';
import { AlertCircle, Wallet } from 'lucide-react';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import { Card, CardHeader } from '../../../../components/ui/Card';

export default function JobOrderCostTab({ jobOrderId }) {
  const { hasPermission } = useAuth();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Explicitly check view permission
  if (!hasPermission('operation_cost.view')) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Akses Ditolak</h3>
        <p className="text-slate-400 text-center max-w-sm">
          Anda tidak memiliki izin untuk melihat data biaya operasional.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const fetchCostSummary = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/job-orders/${jobOrderId}/cost-summary`);
        if (res.data.status === 'success') {
          setSummary(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch job order cost summary', err);
        setError('Gagal memuat ringkasan biaya');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (jobOrderId) {
      fetchCostSummary();
    }
  }, [jobOrderId]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Memuat ringkasan biaya...</div>;
  }

  if (error) {
    return <div className="p-12 text-center text-red-400">{error}</div>;
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCostTypeName = (type) => {
    const types = {
      'TRANSPORT': 'Transportation',
      'TOLL': 'Toll',
      'PARKING': 'Parking',
      'FUEL': 'Fuel',
      'HANDLING': 'Handling',
      'OTHER': 'Other'
    };
    return types[type] || type;
  };

  const { total_recorded_cost, draft_cost, submitted_cost, approved_cost } = summary.summary || {};
  const { by_type = [], by_operation = [] } = summary;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Operation Cost</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(total_recorded_cost)}</p>
          </div>
          <Wallet className="absolute -bottom-4 -right-4 w-24 h-24 text-sky-500/10 group-hover:text-sky-500/20 transition-colors" />
        </div>
        
        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Draft</p>
          <p className="text-2xl font-bold text-slate-200">{formatCurrency(draft_cost)}</p>
        </div>

        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Submitted</p>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(submitted_cost)}</p>
        </div>

        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Approved</p>
          <p className="text-2xl font-bold text-emerald-500">{formatCurrency(approved_cost)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader title="Cost Breakdown" />
          {by_type.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Tidak ada data breakdown</div>
          ) : (
            <div className="p-4 space-y-4">
              {by_type.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{getCostTypeName(item.cost_type)}</p>
                    <p className="text-xs text-slate-500">{item.count} item(s)</p>
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(item.total_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cost by Operation */}
        <Card>
          <CardHeader title="Cost by Operation" />
          {by_operation.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Tidak ada data per operasi</div>
          ) : (
            <div className="p-4 space-y-4">
              {by_operation.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-sky-400">{item.operation_no}</p>
                    <p className="text-xs text-slate-500">{item.count} biaya tercatat</p>
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(item.total_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
