import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCashAdvances } from '../../../services/cashAdvanceService';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function CashAdvanceListPage() {
  const [advances, setAdvances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  const navigate = useNavigate();
  const { showError } = useToast();

  const fetchAdvances = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (scopeFilter) params.advance_scope = scopeFilter;
      
      const res = await getCashAdvances(params);
      if (res.status === 'success') {
        setAdvances(res.data);
      }
    } catch (err) {
      showError('Gagal memuat data Cash Advance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, [search, statusFilter, scopeFilter]);

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

  const renderReference = (adv) => {
    if (adv.advance_scope === 'OPERATION') {
      return (
        <div>
          <div className="font-semibold text-slate-200">{adv.operation_no}</div>
          <div className="text-xs text-slate-500">{adv.job_order_number}</div>
        </div>
      );
    } else if (adv.advance_scope === 'JOB_ORDER') {
      return <div className="font-semibold text-slate-200">{adv.job_order_number}</div>;
    }
    return <span className="text-slate-500">General</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-sky-400" />
            Cash Advance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola request cash advance operasional</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchAdvances} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => navigate('/cash-advances/new')} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            New Cash Advance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50">
          <div className="p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-400">Total Request</span>
            <span className="text-2xl font-bold text-white mt-1">{advances.length}</span>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <div className="p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-400">Draft</span>
            <span className="text-2xl font-bold text-slate-200 mt-1">
              {advances.filter(a => a.status === 'DRAFT').length}
            </span>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-sky-900/30">
          <div className="p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-400">Submitted</span>
            <span className="text-2xl font-bold text-sky-400 mt-1">
              {advances.filter(a => a.status === 'SUBMITTED').length}
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center w-full">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari Advance No, Ref, Tujuan, Penerima..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
              </select>
              <select
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
              >
                <option value="">Semua Scope</option>
                <option value="OPERATION">Operation</option>
                <option value="JOB_ORDER">Job Order</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : advances.length === 0 ? (
          <div className="p-16 text-center">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">Belum ada Cash Advance</h3>
            <p className="text-slate-400 mb-4">Buat request Cash Advance untuk kebutuhan operasional yang memerlukan dana di muka.</p>
            <Button variant="primary" onClick={() => navigate('/cash-advances/new')}>
              <Plus className="w-4 h-4 mr-2" /> New Cash Advance
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ minHeight: '300px' }}>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Advance No</th>
                  <th className="py-3 px-4">Scope & Ref</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {advances.map((adv) => (
                  <tr 
                    key={adv.id} 
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => navigate(`/cash-advances/${adv.id}`)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-400 align-top">
                      {adv.advance_no}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="mb-1">{getScopeBadge(adv.advance_scope)}</div>
                      {renderReference(adv)}
                    </td>
                    <td className="py-3 px-4 font-medium text-white align-top">
                      {adv.driver_name || adv.user_name}
                      <div className="text-xs text-slate-500 font-normal">
                        {adv.driver_id ? 'Driver' : 'Internal User'}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      {formatDate(adv.request_date)}
                    </td>
                    <td className="py-3 px-4 align-top font-semibold text-white">
                      {formatCurrency(adv.amount)}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {getStatusBadge(adv.status)}
                    </td>
                    <td className="py-3 px-4 text-center align-top relative">
                      <TableActionMenu
                        onView={() => navigate(`/cash-advances/${adv.id}`)}
                        onEdit={adv.status === 'DRAFT' ? () => navigate(`/cash-advances/${adv.id}/edit`) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
