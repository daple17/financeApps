import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import settlementService from '../../../services/settlementService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function SettlementListPage() {
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const navigate = useNavigate();
  const { showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const res = await settlementService.getAll(params);
      if (res.status === 'success') {
        setSettlements(res.data);
      }
    } catch (err) {
      showError('Gagal memuat data Settlement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [search, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="default">Draft</Badge>;
      case 'SUBMITTED': return <Badge variant="warning">Submitted</Badge>;
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      case 'POSTED': return <Badge variant="primary">Posted</Badge>;
      case 'CANCELLED': return <Badge variant="default">Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getScopeBadge = (scope) => {
    switch (scope) {
      case 'OPERATION': return <Badge variant="primary">Operation</Badge>;
      case 'JOB_ORDER': return <Badge variant="warning">Job Order</Badge>;
      case 'DRIVER': return <Badge variant="info">Driver</Badge>;
      default: return <Badge variant="default">{scope}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSummaryCounts = () => {
    return {
      total: settlements.length,
      draft: settlements.filter(s => s.status === 'DRAFT').length,
      submitted: settlements.filter(s => s.status === 'SUBMITTED').length,
      approved: settlements.filter(s => s.status === 'APPROVED').length,
      posted: settlements.filter(s => s.status === 'POSTED').length,
    };
  };

  const counts = getSummaryCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary-400" />
            Settlements
          </h1>
          <p className="text-sm text-gray-400 mt-1">Kelola pertanggungjawaban biaya operasional</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="secondary" 
            onClick={fetchSettlements}
            disabled={isLoading}
            className="hidden sm:flex"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {hasPermission('settlement.create') && (
            <Button onClick={() => navigate('/settlements/new')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Settlement
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-4">
            <p className="text-sm text-gray-400 font-medium">TOTAL</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">{counts.total}</p>
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-4">
            <p className="text-sm text-gray-400 font-medium">DRAFT</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">{counts.draft}</p>
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-4">
            <p className="text-sm text-warning-400 font-medium">SUBMITTED</p>
            <p className="text-2xl font-bold text-warning-400 mt-1">{counts.submitted}</p>
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-4">
            <p className="text-sm text-success-400 font-medium">APPROVED</p>
            <p className="text-2xl font-bold text-success-400 mt-1">{counts.approved}</p>
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-4">
            <p className="text-sm text-primary-400 font-medium">POSTED</p>
            <p className="text-2xl font-bold text-primary-400 mt-1">{counts.posted}</p>
          </div>
        </Card>
      </div>

      {/* Filters & Data */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between border-b border-gray-700 pb-4">
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Cari No Settlement / Advance..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <select
              className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-48 p-2.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="POSTED">Posted</option>
            </select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Settlement No</th>
                <th className="px-6 py-4 font-medium">Cash Advance</th>
                <th className="px-6 py-4 font-medium">Scope</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Recipient</th>
                <th className="px-6 py-4 font-medium text-right">Advance Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actual Expense</th>
                <th className="px-6 py-4 font-medium text-right">Difference</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data settlement yang ditemukan
                  </td>
                </tr>
              ) : (
                settlements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {item.settlement_no}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.settlement_date).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {item.advance_no}
                    </td>
                    <td className="px-6 py-4">
                      {getScopeBadge(item.advance_scope)}
                    </td>
                    <td className="px-6 py-4">
                      {item.job_order_number && (
                        <div className="text-gray-300">JO: {item.job_order_number}</div>
                      )}
                      {item.operation_no && (
                        <div className="text-gray-400 text-xs">OP: {item.operation_no}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {item.recipient_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 font-medium">
                      {formatCurrency(item.total_advance)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 font-medium">
                      {formatCurrency(item.total_expense)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={item.difference > 0 ? 'text-warning-400' : item.difference < 0 ? 'text-danger-400' : 'text-success-400'}>
                        {formatCurrency(Math.abs(item.difference))}
                        {item.difference > 0 ? ' (Sisa)' : item.difference < 0 ? ' (Kurang)' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <TableActionMenu
                          actions={[
                            {
                              label: 'Lihat Detail',
                              onClick: () => navigate(`/settlements/${item.id}`)
                            }
                          ]}
                        />
                      </div>
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
