import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCw, Search, Filter, Truck, MoreVertical, Eye, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function JobOrderListPage() {
  const [jobOrders, setJobOrders] = useState([]);
  const [summary, setSummary] = useState({ total: 0, in_progress: 0, completed: 0, draft: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const fetchJobOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await api.get(`/job-orders?${params.toString()}`);
      if (res.data.status === 'success') {
        setJobOrders(res.data.data);
        if (res.data.meta && res.data.meta.summary) {
          setSummary(res.data.meta.summary);
        }
      }
    } catch (err) {
      showError('Gagal memuat data Job Order');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOrders();
  }, [search, statusFilter, typeFilter, startDate, endDate]);

  const formatCompactDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const renderReference = (job) => {
    let label = 'Customer Ref.';
    let value = job.customer_reference || '-';

    if (job.job_order_type === 'EXPORT' && job.export_detail) {
      if (job.export_detail.bl_number) {
        label = 'B/L';
        value = job.export_detail.bl_number;
      } else if (job.export_detail.si_do_number) {
        label = 'SI';
        value = job.export_detail.si_do_number;
      }
    }

    if (job.job_order_type === 'IMPORT' && job.import_detail) {
      if (job.import_detail.bl_number) {
        label = 'B/L';
        value = job.import_detail.bl_number;
      } else if (job.import_detail.do_number) {
        label = 'DO';
        value = job.import_detail.do_number;
      }
    }

    if (job.job_order_type === 'TRUCKING' && job.trucking_detail) {
      if (job.trucking_detail.bl_number) {
        label = 'B/L';
        value = job.trucking_detail.bl_number;
      } else if (job.trucking_detail.si_do_number) {
        label = 'SI / DO';
        value = job.trucking_detail.si_do_number;
      }
    }

    if (job.job_order_type === 'PROJECT' && job.project_detail) {
      if (job.project_detail.si_do_number) {
        label = 'SI / DO';
        value = job.project_detail.si_do_number;
      }
    }

    return (
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
        <span className="text-white font-medium max-w-[150px] truncate" title={value}>{value}</span>
      </div>
    );
  };

  const renderShipment = (job) => {
    const pickup = job.pickup_location || '?';
    const delivery = job.delivery_location || '?';
    
    let secondary = null;
    if (job.job_order_type === 'EXPORT' && job.export_detail?.vessel) {
      secondary = job.export_detail.vessel;
    } else if (job.job_order_type === 'IMPORT' && job.import_detail?.vessel) {
      secondary = job.import_detail.vessel;
    } else if (job.job_order_type === 'TRUCKING' && job.trucking_detail?.vessel) {
      secondary = job.trucking_detail.vessel;
    } else if (job.job_order_type === 'PROJECT' && job.project_detail?.project_name) {
      secondary = job.project_detail.project_name;
    }

    return (
      <div className="text-xs">
        <div className="text-white flex items-center gap-1">
          <span className="max-w-[80px] truncate" title={pickup}>{pickup}</span>
          <span className="text-slate-500">→</span>
          <span className="max-w-[80px] truncate" title={delivery}>{delivery}</span>
        </div>
        {secondary && <div className="text-slate-400 mt-0.5 truncate max-w-[170px]">{secondary}</div>}
      </div>
    );
  };

  const renderSchedule = (job) => {
    if (job.job_order_type === 'EXPORT' && job.export_detail) {
      const etd = job.export_detail.etd_date;
      const planned = job.export_detail.planned_delivery_date;
      
      if (etd && planned) {
        return (
          <div className="text-xs text-slate-300">
            <div><span className="text-slate-500 mr-1 inline-block w-[50px]">ETD</span>{formatCompactDate(etd)}</div>
            <div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(planned)}</div>
          </div>
        );
      } else if (etd) {
        return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">ETD</span>{formatCompactDate(etd)}</div></div>;
      } else if (planned) {
        return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(planned)}</div></div>;
      }
    }

    if (job.job_order_type === 'IMPORT' && job.import_detail) {
      const eta = job.import_detail.eta_date;
      const planned = job.import_detail.planned_delivery_date;
      
      if (eta && planned) {
        return (
          <div className="text-xs text-slate-300">
            <div><span className="text-slate-500 mr-1 inline-block w-[50px]">ETA</span>{formatCompactDate(eta)}</div>
            <div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(planned)}</div>
          </div>
        );
      } else if (eta) {
        return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">ETA</span>{formatCompactDate(eta)}</div></div>;
      } else if (planned) {
        return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(planned)}</div></div>;
      }
    }

    if (job.job_order_type === 'TRUCKING' && job.trucking_detail) {
      const planned = job.trucking_detail.planned_delivery_date;
      if (planned) {
        return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(planned)}</div></div>;
      }
    }

    if (job.job_order_type === 'PROJECT' && job.project_detail) {
      const planned = job.project_detail.planned_delivery_date;
      if (planned) {
        return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(planned)}</div></div>;
      }
    }

    const pickupDate = job.pickup_date || job.job_date;
    const deliveryDate = job.delivery_target_date;

    if (pickupDate && deliveryDate) {
      return (
        <div className="text-xs text-slate-300">
          <div><span className="text-slate-500 mr-1 inline-block w-[50px]">Pickup</span>{formatCompactDate(pickupDate)}</div>
          <div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(deliveryDate)}</div>
        </div>
      );
    } else if (pickupDate) {
      return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Pickup</span>{formatCompactDate(pickupDate)}</div></div>;
    } else if (deliveryDate) {
      return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Delivery</span>{formatCompactDate(deliveryDate)}</div></div>;
    }

    if (job.delivery_target_date) {
      return <div className="text-xs text-slate-300"><div><span className="text-slate-500 mr-1 inline-block w-[50px]">Target</span>{formatCompactDate(job.delivery_target_date)}</div></div>;
    }

    return <span className="text-slate-500">-</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="default">Draft</Badge>;
      case 'CONFIRMED': return <Badge variant="primary">Confirmed</Badge>;
      case 'ASSIGNED': return <Badge variant="warning">Assigned</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">In Progress</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CLOSED': return <Badge variant="success">Closed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  const SummaryCard = ({ title, count, isActive, onClick }) => (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isActive 
          ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
          : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
      }`}
    >
      <div className="text-xs font-semibold text-slate-400 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${isActive ? 'text-sky-400' : 'text-white'}`}>
        {count}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-400" />
            Job Order
          </h1>
          <p className="text-sm text-slate-400 mt-1">Kelola seluruh pekerjaan dan aktivitas operasional logistik.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchJobOrders} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/job-orders/create')}>
            <Plus className="w-4 h-4" />
            Buat Job Order
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="TOTAL JOB" 
          count={summary.total} 
          isActive={statusFilter === ''} 
          onClick={() => setStatusFilter('')} 
        />
        <SummaryCard 
          title="IN PROGRESS" 
          count={summary.in_progress} 
          isActive={statusFilter === 'IN_PROGRESS'} 
          onClick={() => setStatusFilter('IN_PROGRESS')} 
        />
        <SummaryCard 
          title="COMPLETED" 
          count={summary.completed} 
          isActive={statusFilter === 'COMPLETED'} 
          onClick={() => setStatusFilter('COMPLETED')} 
        />
        <SummaryCard 
          title="DRAFT" 
          count={summary.draft} 
          isActive={statusFilter === 'DRAFT'} 
          onClick={() => setStatusFilter('DRAFT')} 
        />
      </div>

      <Card>
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-4 bg-slate-900/40">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Cari No. JO / Customer / Lokasi..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-500" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors appearance-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Semua Type</option>
                <option value="IMPORT">Import</option>
                <option value="EXPORT">Export</option>
                <option value="TRUCKING">Trucking</option>
                <option value="PROJECT">Project</option>
              </select>
            </div>
            
            <div className="w-full sm:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-500" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Button 
              variant={showAdvancedFilter || startDate || endDate ? "primary" : "outline"}
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Advanced Filter Collapse */}
          {showAdvancedFilter && (
            <div className="pt-4 border-t border-slate-800 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Dari</label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Sampai</label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                 <Button variant="outline" className="w-full" onClick={resetFilters}>
                   Reset Filter
                 </Button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : jobOrders.length === 0 ? (
          <div className="p-16 text-center">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              {(search || statusFilter || typeFilter || startDate || endDate) 
                ? "Tidak ada Job Order yang sesuai dengan filter." 
                : "Belum ada Job Order."}
            </h3>
            {(search || statusFilter || typeFilter || startDate || endDate) ? (
               <Button variant="outline" className="mt-4" onClick={resetFilters}>
                 Reset Filter
               </Button>
            ) : (
              <Button variant="primary" className="mt-4" onClick={() => navigate('/job-orders/create')}>
                <Plus className="w-4 h-4 mr-2" /> Buat Job Order
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ minHeight: '300px' }}>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">No. JO</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Shipment</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {jobOrders.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => navigate(`/job-orders/${job.id}`)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-400 align-top">
                      {job.job_order_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-[150px] truncate align-top" title={job.customer_name}>
                      {job.customer_name || '-'}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {job.job_order_type ? (
                        <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                          {job.job_order_type}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase">
                          UNSET
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {renderReference(job)}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {renderShipment(job)}
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      {renderSchedule(job)}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {getStatusBadge(job.job_status)}
                    </td>
                    <td className="py-3 px-4 text-center align-top relative">
                      <TableActionMenu
                        onView={() => navigate(`/job-orders/${job.id}`)}
                        onEdit={() => navigate(`/job-orders/${job.id}/edit`)}
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
