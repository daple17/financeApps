import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, History, Briefcase, MapPin, CheckCircle, AlertCircle, RefreshCw, User, Truck, LogOut, Wallet } from 'lucide-react';
import operationService from '../../../services/operationService';
import AssignResourceModal from './AssignResourceModal';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import OperationDocumentsTab from './documents/OperationDocumentsTab';
import OperationCostTab from './costs/OperationCostTab';

export default function OperationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [operation, setOperation] = useState(null);
  const [events, setEvents] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  
  // Status update modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [nextAction, setNextAction] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [opRes, evRes, assignRes] = await Promise.all([
        operationService.getById(id),
        operationService.getEvents(id),
        operationService.getAssignment(id)
      ]);
      if (opRes.status === 'success') setOperation(opRes.data);
      if (evRes.status === 'success') setEvents(evRes.data);
      if (assignRes.status === 'success') setAssignment(assignRes.data);
    } catch (error) {
      showError('Gagal memuat detail operation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status, notes = '', reason = '') => {
    setIsUpdatingStatus(true);
    try {
      await operationService.updateStatus(id, status, notes, reason);
      showSuccess(`Berhasil update status ke ${status}`);
      setShowConfirmModal(false);
      setShowCancelModal(false);
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal mengupdate status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReleaseResource = async () => {
    if (!window.confirm('Yakin ingin merilis (release) driver dan kendaraan ini dari operation?')) return;
    setIsReleasing(true);
    try {
      await operationService.releaseResource(id);
      showSuccess('Resource berhasil di-release');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal merilis resource');
    } finally {
      setIsReleasing(false);
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
      case 'STARTED': return <Badge variant="primary">Started</Badge>;
      case 'ARRIVED_PICKUP': return <Badge variant="primary">At Pickup</Badge>;
      case 'PICKED_UP': return <Badge variant="primary">Picked Up</Badge>;
      case 'IN_TRANSIT': return <Badge variant="primary">In Transit</Badge>;
      case 'ARRIVED_DESTINATION': return <Badge variant="primary">At Destination</Badge>;
      case 'DELIVERED': return <Badge variant="primary">Delivered</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getContextualAction = (status) => {
    switch (status) {
      case 'PLANNING': return { label: 'Mark as Ready', next: 'READY' };
      case 'READY': return { label: 'Start Operation', next: 'STARTED' };
      case 'STARTED': return { label: 'Arrived at Pickup', next: 'ARRIVED_PICKUP' };
      case 'ARRIVED_PICKUP': return { label: 'Confirm Pickup', next: 'PICKED_UP' };
      case 'PICKED_UP': return { label: 'Start Transit', next: 'IN_TRANSIT' };
      case 'IN_TRANSIT': return { label: 'Arrived at Destination', next: 'ARRIVED_DESTINATION' };
      case 'ARRIVED_DESTINATION': return { label: 'Confirm Delivery', next: 'DELIVERED' };
      case 'DELIVERED': return { label: 'Complete Operation', next: 'COMPLETED' };
      default: return null;
    }
  };

  const currentAction = operation ? getContextualAction(operation.status) : null;

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
          {currentAction && (
            <Button variant="primary" onClick={() => {
              setNextAction(currentAction);
              setShowConfirmModal(true);
            }}>
              <CheckCircle className="w-4 h-4 mr-2" /> {currentAction.label}
            </Button>
          )}
          {(!['COMPLETED', 'CANCELLED'].includes(operation.status)) && (
            <Button variant="danger" onClick={() => {
              setCancellationReason('');
              setShowCancelModal(true);
            }}>
              Cancel Operation
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/operations/${id}/edit`)}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit Operation
          </Button>
        </div>
      </div>

      <div className="border-b border-slate-800">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {['OVERVIEW', 'COST', 'DOCUMENTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Operation Summary" />
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
            <CardHeader title="Job Order Information" />
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
            <CardHeader 
              title="Resource Assignment" 
              action={
                (!assignment && ['PLANNING', 'READY'].includes(operation.status)) && (
                  <Button variant="primary" size="sm" onClick={() => setShowAssignModal(true)}>
                    Assign Resource
                  </Button>
                )
              } 
            />
            <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
              {!assignment ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-300">Belum ada Resource yang di-assign</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">Silakan assign driver dan kendaraan untuk operation ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Assigned Driver</div>
                      <div className="text-sm font-medium text-white">{assignment.driver_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{assignment.phone_number || 'No Phone'} • {assignment.license_type || 'No License Type'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Assigned Vehicle</div>
                      <div className="text-sm font-medium text-white">{assignment.plate_number}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{assignment.vehicle_type_name || 'Unknown Type'} • {assignment.capacity_weight ? `${assignment.capacity_weight} kg` : 'No Capacity'}</div>
                    </div>
                  </div>
                  
                  {['PLANNING', 'READY'].includes(operation.status) && (
                    <div className="md:col-span-2 flex justify-end">
                      <Button variant="danger" size="sm" onClick={handleReleaseResource} isLoading={isReleasing}>
                        <LogOut className="w-4 h-4 mr-2" /> Release Resource
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Execution Progress" />
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Current Status</span>
                  <span className="font-bold">{getStatusBadge(operation.status)}</span>
                </div>
                <hr className="border-slate-800" />
                <div className="relative border-l-2 border-slate-800 ml-2 space-y-4 pt-2">
                  {[
                    { label: 'Planning', ts: operation.created_at, active: true },
                    { label: 'Ready', ts: null, active: !['PLANNING'].includes(operation.status) },
                    { label: 'Started', ts: operation.actual_start_at, active: operation.actual_start_at != null },
                    { label: 'Arrived Pickup', ts: operation.arrived_pickup_at, active: operation.arrived_pickup_at != null },
                    { label: 'Picked Up', ts: operation.picked_up_at, active: operation.picked_up_at != null },
                    { label: 'In Transit', ts: operation.in_transit_at, active: operation.in_transit_at != null },
                    { label: 'Arrived Destination', ts: operation.arrived_destination_at, active: operation.arrived_destination_at != null },
                    { label: 'Delivered', ts: operation.delivered_at, active: operation.delivered_at != null },
                    { label: 'Completed', ts: operation.actual_completion_at, active: operation.actual_completion_at != null },
                  ].map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-slate-900
                        ${step.active ? 'border-emerald-500' : 'border-slate-700'}
                      `}>
                        {step.active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm ${step.active ? 'text-white font-medium' : 'text-slate-500'}`}>{step.label}</span>
                        {step.ts && <span className="text-xs text-slate-400 mt-0.5">{formatDate(step.ts)}</span>}
                      </div>
                    </div>
                  ))}
                  
                  {operation.status === 'CANCELLED' && (
                    <div className="relative pl-6 mt-4">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-rose-500 bg-slate-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">Cancelled</span>
                        <span className="text-xs text-slate-400 mt-0.5">{formatDate(operation.cancelled_at)}</span>
                        <span className="text-xs text-rose-400 mt-1">Reason: {operation.cancellation_reason}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Operation Timeline" />
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
        )}

        {activeTab === 'DOCUMENTS' && (
          <OperationDocumentsTab operationId={id} operationStatus={operation.status} />
        )}

        {activeTab === 'COST' && (
          <OperationCostTab operationId={id} jobOrderId={operation?.job_order_id} />
        )}
      </div>

      {/* Confirm Action Modal */}
      {showConfirmModal && nextAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Konfirmasi Tindakan</h3>
            </div>
            <div className="p-5">
              <p className="text-slate-300">Anda yakin ingin melanjutkan tindakan: <strong>{nextAction.label}</strong>?</p>
            </div>
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Batal</Button>
              <Button onClick={() => handleUpdateStatus(nextAction.next)} isLoading={isUpdatingStatus}>Konfirmasi</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Operation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-rose-500">Cancel Operation</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300">
                Peringatan: Membatalkan operasi akan menghentikan seluruh aktivitas terkait dan otomatis merilis (release) semua resource (Driver & Vehicle) yang ditugaskan.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Alasan Pembatalan <span className="text-rose-500">*</span></label>
                <textarea 
                  className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  rows="3"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Wajib diisi..."
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20">
              <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Kembali</Button>
              <Button variant="danger" onClick={() => handleUpdateStatus('CANCELLED', '', cancellationReason)} isLoading={isUpdatingStatus}>Batalkan Operation</Button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <AssignResourceModal 
          operation={operation} 
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
