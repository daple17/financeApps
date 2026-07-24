import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, History, Briefcase, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import operationService from '../../../services/operationService';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

export default function OperationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [operation, setOperation] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [opRes, evRes] = await Promise.all([
        operationService.getById(id),
        operationService.getEvents(id)
      ]);
      if (opRes.status === 'success') setOperation(opRes.data);
      if (evRes.status === 'success') setEvents(evRes.data);
    } catch (error) {
      showError('Gagal memuat detail operation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setIsUpdatingStatus(true);
    try {
      await operationService.updateStatus(id, newStatus, statusNotes);
      showSuccess('Status berhasil diupdate');
      setShowStatusModal(false);
      fetchData();
    } catch (error) {
      showError('Gagal mengupdate status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading...</div>;
  }

  if (!operation) {
    return <div className="text-center py-12 text-slate-400">Operation tidak ditemukan.</div>;
  }

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/operations')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{operation.operation_no}</h1>
              {getStatusBadge(operation.status)}
            </div>
            <p className="text-sm text-slate-400 mt-1">Operation Detail & Execution</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => {
            setNewStatus(operation.status);
            setStatusNotes('');
            setShowStatusModal(true);
          }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Update Status
          </Button>
          <Button variant="primary" onClick={() => navigate(`/operations/${id}/edit`)}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit Operation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Operation Summary</h2>
            </CardHeader>
            <div className="p-1 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Priority</p>
                <p className="text-sm text-slate-200 mt-1">{operation.priority}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Operation Date</p>
                <p className="text-sm text-slate-200 mt-1">{operation.operation_date ? new Date(operation.operation_date).toLocaleDateString('id-ID') : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Planned Start</p>
                <p className="text-sm text-slate-200 mt-1">{formatDate(operation.planned_start)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Planned Completion</p>
                <p className="text-sm text-slate-200 mt-1">{formatDate(operation.planned_completion)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Operational PIC</p>
                <p className="text-sm text-slate-200 mt-1">{operation.pic_name || 'Unassigned'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Execution Scope</p>
                <p className="text-sm text-slate-200 mt-1">
                  {operation.execution_quantity ? `${operation.execution_quantity} ${operation.execution_unit || ''}` : 'Full'}
                </p>
              </div>
              <div className="col-span-4">
                <p className="text-xs text-slate-500 uppercase font-semibold">Notes</p>
                <div className="text-sm text-slate-300 mt-1 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  {operation.notes || 'No notes available.'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Job Order Information</h2>
            </CardHeader>
            <div className="p-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Job Order No</p>
                  <p className="text-sky-400 font-medium text-lg cursor-pointer hover:underline" onClick={() => navigate(`/job-orders/${operation.job_order_id}`)}>
                    {operation.job_order_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Type & Service</p>
                  <div className="flex gap-2 items-center justify-end mt-1">
                    <Badge variant="outline">{operation.job_order_type}</Badge>
                    <span className="text-sm text-slate-300">{operation.service_type || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Pickup Location</p>
                    <p className="text-sm text-slate-200 mt-1">{operation.pickup_location || '-'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Delivery Location</p>
                    <p className="text-sm text-slate-200 mt-1">{operation.delivery_location || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Customer</p>
                  <p className="text-sm text-slate-200 mt-1">{operation.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Customer PIC</p>
                  <p className="text-sm text-slate-200 mt-1">{operation.customer_pic_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Cargo</p>
                  <p className="text-sm text-slate-200 mt-1">
                    {operation.cargo_quantity || 0} {operation.cargo_unit || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Requirement</p>
                  <p className="text-sm text-slate-200 mt-1">
                    {operation.container_type || operation.vehicle_type_requirement || '-'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Assignment & Execution (Phase 3.3)</h2>
            </CardHeader>
            <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-900/30 rounded-xl border border-slate-800/50">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-300">Belum ada Driver atau Kendaraan yang di-assign</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">Fitur Driver, Vehicle Assignment, Tracking, dan Proof of Delivery akan diimplementasikan pada fase berikutnya.</p>
            </div>
          </Card>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">Operation Timeline</h2>
              </div>
            </CardHeader>
            <div className="p-1">
              <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
                {events.length === 0 ? (
                  <div className="pl-4 text-sm text-slate-500">Belum ada aktivitas tercatat.</div>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">
                          {ev.event_type === 'STATUS_CHANGED' ? `Status: ${ev.new_value}` : ev.event_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">{formatDate(ev.event_time)} • {ev.user_name || 'System'}</span>
                        {ev.notes && (
                          <div className="mt-2 text-sm text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700">
                            {ev.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Update Status Operation</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Status Baru</label>
                <select 
                  className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="PLANNING">Planning</option>
                  <option value="READY">Ready</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Catatan Status (Opsional)</label>
                <textarea 
                  className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  rows="3"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Berikan alasan atau keterangan..."
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20">
              <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Batal</Button>
              <Button onClick={handleUpdateStatus} isLoading={isUpdatingStatus}>Simpan Status</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
