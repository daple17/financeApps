import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft, Briefcase, Calendar, MapPin, Truck, AlertCircle } from 'lucide-react';
import operationService from '../../../services/operationService';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';

export default function OperationForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prefillJobOrderId = searchParams.get('jobOrderId');
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  
  const [jobOrders, setJobOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedJobOrder, setSelectedJobOrder] = useState(null);
  const [allocationBalance, setAllocationBalance] = useState(null);

  const [formData, setFormData] = useState({
    job_order_id: prefillJobOrderId || '',
    operation_date: new Date().toISOString().split('T')[0],
    planned_start: '',
    planned_completion: '',
    operational_pic_id: '',
    priority: 'NORMAL',
    status: 'PLANNING',
    execution_quantity: '',
    execution_unit: '',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      // Fetch users for PIC dropdown
      const usersRes = await api.get('/users');
      if (usersRes.data.status === 'success') {
        setUsers(usersRes.data.data);
      }

      // If Edit Mode, fetch operation
      if (id) {
        const opRes = await operationService.getById(id);
        if (opRes.status === 'success') {
          const op = opRes.data;
          setFormData({
            job_order_id: op.job_order_id,
            operation_date: op.operation_date ? op.operation_date.split('T')[0] : '',
            planned_start: op.planned_start ? op.planned_start.slice(0, 16) : '',
            planned_completion: op.planned_completion ? op.planned_completion.slice(0, 16) : '',
            operational_pic_id: op.operational_pic_id || '',
            priority: op.priority || 'NORMAL',
            status: op.status || 'PLANNING',
            execution_quantity: op.execution_quantity || '',
            execution_unit: op.execution_unit || '',
            notes: op.notes || ''
          });
          // For edit mode, we just build a snapshot from the returned data
          setSelectedJobOrder({
            id: op.job_order_id,
            job_order_number: op.job_order_number,
            customer_name: op.customer_name,
            job_order_type: op.job_order_type,
            service_type: op.service_type,
            customer_pic_name: op.customer_pic_name,
            pickup_location: op.pickup_location,
            delivery_location: op.delivery_location,
            cargo_unit: op.cargo_unit,
            cargo_quantity: op.cargo_quantity,
            vehicle_type_requirement: op.vehicle_type_requirement,
            container_type: op.container_type
          });
        }
      } else {
        // Fetch Job Orders for creation
        const joRes = await api.get('/job-orders');
        if (joRes.data.status === 'success') {
          // Ideally we filter out CANCELLED or invalid statuses
          const validJo = joRes.data.data.filter(j => j.job_status !== 'CANCELLED');
          setJobOrders(validJo);
          
          if (prefillJobOrderId) {
            const prefilled = validJo.find(j => j.id === Number(prefillJobOrderId));
            if (prefilled) {
              fetchJobOrderDetail(prefilled.id);
            }
          }
        }
      }
    } catch (err) {
      showError('Gagal memuat data referensi');
    } finally {
      setIsFetchingData(false);
    }
  };

  const fetchJobOrderDetail = async (jobOrderId) => {
    try {
      const res = await api.get(`/job-orders/${jobOrderId}`);
      if (res.data.status === 'success') {
        setSelectedJobOrder(res.data.data);
      }
      
      const balRes = await api.get(`/job-orders/${jobOrderId}/allocation-balance`);
      if (balRes.data.status === 'success') {
        const bal = balRes.data.data;
        setAllocationBalance(bal);
        if (!id) {
          setFormData(prev => ({ ...prev, execution_unit: bal.unit, execution_quantity: bal.remaining > 0 ? bal.remaining : '' }));
        }
      }
    } catch (err) {
      showError('Gagal memuat detail Job Order atau balance');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'job_order_id' && value) {
      fetchJobOrderDetail(value);
    } else if (name === 'job_order_id' && !value) {
      setSelectedJobOrder(null);
      setAllocationBalance(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.job_order_id) {
      showError('Pilih Job Order terlebih dahulu');
      return;
    }

    setIsLoading(true);
    try {
      if (id) {
        await operationService.update(id, formData);
        showSuccess('Operation berhasil diupdate');
      } else {
        await operationService.create(formData);
        showSuccess('Operation berhasil dibuat');
      }
      navigate('/operations');
    } catch (error) {
      showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan Operation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {id ? 'Edit Operation' : 'Buat Operation'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {id ? 'Perbarui informasi eksekusi operasional.' : 'Buat eksekusi operasional baru untuk Job Order.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Batal</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            <Save className="w-4 h-4 mr-2" /> Simpan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">Operation Information</h2>
              </div>
            </CardHeader>
            <div className="space-y-6 p-1">
              {!id && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Pilih Job Order <span className="text-red-400">*</span></label>
                  <select 
                    className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    name="job_order_id" 
                    value={formData.job_order_id} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">-- Pilih Job Order --</option>
                    {jobOrders.map(j => (
                      <option key={j.id} value={j.id}>{j.job_order_number} - {j.customer?.name} ({j.job_order_type})</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Tanggal Operation" 
                  type="date" 
                  name="operation_date" 
                  value={formData.operation_date} 
                  onChange={handleChange} 
                  required 
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Operational PIC</label>
                  <select 
                    className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    name="operational_pic_id" 
                    value={formData.operational_pic_id} 
                    onChange={handleChange}
                  >
                    <option value="">-- Pilih PIC Internal --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role_name || 'User'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Planned Start" 
                  type="datetime-local" 
                  name="planned_start" 
                  value={formData.planned_start} 
                  onChange={handleChange} 
                />
                <Input 
                  label="Planned Completion" 
                  type="datetime-local" 
                  name="planned_completion" 
                  value={formData.planned_completion} 
                  onChange={handleChange} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Prioritas</label>
                  <select 
                    className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleChange}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Execution Quantity</label>
                  <div className="flex gap-2">
                    <input 
                      className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full"
                      type="number" 
                      step="0.01"
                      max={allocationBalance ? allocationBalance.remaining : undefined}
                      name="execution_quantity" 
                      value={formData.execution_quantity} 
                      onChange={handleChange}
                      placeholder={allocationBalance ? `Max: ${allocationBalance.remaining}` : "Misal: 3"}
                    />
                    <input 
                      className="bg-slate-800 border border-slate-700 text-slate-400 text-sm rounded-xl px-3.5 py-2.5 w-24 text-center cursor-not-allowed"
                      type="text" 
                      name="execution_unit" 
                      value={formData.execution_unit || (allocationBalance?.unit || '')} 
                      readOnly
                      title="Sesuai dari Job Order"
                    />
                  </div>
                  {allocationBalance && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Target: <span className="font-medium text-slate-300">{allocationBalance.ordered}</span> • 
                      Allocated: <span className="font-medium text-sky-400">{allocationBalance.allocated}</span> • 
                      Sisa: <span className="font-medium text-emerald-400">{allocationBalance.remaining} {allocationBalance.unit}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Operational Notes</label>
                <textarea 
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[100px]"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Catatan tambahan untuk operasi ini..."
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">Job Order Snapshot</h2>
              </div>
            </CardHeader>
            <div className="p-1">
              {!selectedJobOrder ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Pilih Job Order untuk melihat snapshot.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Job Order No</p>
                    <p className="text-sky-400 font-medium text-lg">{selectedJobOrder.job_order_number || selectedJobOrder.job_order?.job_order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Customer</p>
                    <p className="text-slate-200">{selectedJobOrder.customer_name || selectedJobOrder.customer?.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Type</p>
                      <Badge variant="outline">{selectedJobOrder.job_order_type}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Service</p>
                      <p className="text-slate-200 text-sm">{selectedJobOrder.service_type || '-'}</p>
                    </div>
                  </div>
                  
                  <hr className="border-slate-800" />
                  
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Pickup</p>
                      <p className="text-sm text-slate-300">{selectedJobOrder.pickup_location || '-'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-rose-400 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Delivery</p>
                      <p className="text-sm text-slate-300">{selectedJobOrder.delivery_location || '-'}</p>
                    </div>
                  </div>
                  
                  <hr className="border-slate-800" />

                  <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Qty</p>
                      <p className="text-slate-200 text-sm font-medium">
                        {selectedJobOrder.cargo_quantity || 0} {selectedJobOrder.cargo_unit || 'Unit'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Requirement</p>
                      <p className="text-slate-200 text-sm">
                        {selectedJobOrder.container_type || selectedJobOrder.vehicle_type_requirement || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
