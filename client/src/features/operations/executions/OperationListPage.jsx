import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, Briefcase, Edit2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import operationService from '../../../services/operationService';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function OperationListPage() {
  const [operations, setOperations] = useState([]);
  const [summary, setSummary] = useState({ total: 0, planning: 0, in_progress: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const navigate = useNavigate();
  const { showError } = useToast();

  const fetchOperations = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const res = await operationService.getAll(params);
      if (res.status === 'success') {
        setOperations(res.data);
        
        // Compute summary
        const sum = { total: res.data.length, planning: 0, in_progress: 0, completed: 0 };
        res.data.forEach(op => {
          if (op.status === 'PLANNING') sum.planning++;
          if (op.status === 'IN_PROGRESS') sum.in_progress++;
          if (op.status === 'COMPLETED') sum.completed++;
        });
        setSummary(sum);
      }
    } catch (err) {
      showError('Gagal memuat data Operations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [search, statusFilter]);

  const formatCompactDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLANNING': return <Badge variant="warning">Planning</Badge>;
      case 'READY': return <Badge variant="info">Ready</Badge>;
      case 'IN_PROGRESS': return <Badge variant="primary">In Progress</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const SummaryCard = ({ title, count, isActive, onClick }) => (
    <Card 
      className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-sky-500 bg-slate-800/80' : 'hover:bg-slate-800/50'}`}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{count}</h3>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola eksekusi operasional Job Order.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={fetchOperations} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate('/operations/create')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Buat Operation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Operations" 
          count={summary.total} 
          isActive={statusFilter === ''} 
          onClick={() => setStatusFilter('')} 
        />
        <SummaryCard 
          title="Planning" 
          count={summary.planning} 
          isActive={statusFilter === 'PLANNING'} 
          onClick={() => setStatusFilter('PLANNING')} 
        />
        <SummaryCard 
          title="In Progress" 
          count={summary.in_progress} 
          isActive={statusFilter === 'IN_PROGRESS'} 
          onClick={() => setStatusFilter('IN_PROGRESS')} 
        />
        <SummaryCard 
          title="Completed" 
          count={summary.completed} 
          isActive={statusFilter === 'COMPLETED'} 
          onClick={() => setStatusFilter('COMPLETED')} 
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">Daftar Operations</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Cari No. Operation, Job Order..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <select 
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="PLANNING">Planning</option>
                <option value="READY">Ready</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase border-y border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Operation No</th>
                <th className="py-3 px-4 font-semibold">Job Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Route (Pickup - Dest)</th>
                <th className="py-3 px-4 font-semibold">Execution Scope</th>
                <th className="py-3 px-4 font-semibold">Schedule</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Tidak ada data operation ditemukan.
                  </td>
                </tr>
              ) : (
                operations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span 
                        className="text-sky-400 font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(`/operations/${op.id}`)}
                      >
                        {op.operation_no}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{op.job_order_number}</span>
                      <span className="block text-xs text-slate-500">{op.job_order_type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white truncate max-w-[150px] block" title={op.customer_name}>
                        {op.customer_name || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium truncate max-w-[150px]" title={op.pickup_location}>{op.pickup_location || '?'}</span>
                        <span className="text-slate-500 text-xs">ke</span>
                        <span className="text-slate-300 truncate max-w-[150px]" title={op.delivery_location}>{op.delivery_location || '?'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{op.execution_quantity || 0} {op.execution_unit || ''}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-300">{formatCompactDate(op.operation_date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(op.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <TableActionMenu
                        onView={() => navigate(`/operations/${op.id}`)}
                        onEdit={() => navigate(`/operations/${op.id}/edit`)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
