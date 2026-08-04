import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, Send, ArrowLeft, Wallet } from 'lucide-react';
import { 
  getCashAdvanceById, 
  createCashAdvance, 
  updateCashAdvance, 
  submitCashAdvance 
} from '../../../services/cashAdvanceService';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function CashAdvanceFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const prefillOperationId = searchParams.get('operation_id');
  const prefillJobOrderId = searchParams.get('job_order_id');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Options for dropdowns
  const [operations, setOperations] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    advance_scope: 'OPERATION',
    job_order_id: '',
    operation_id: '',
    recipient_type: 'DRIVER', // 'DRIVER' or 'USER'
    driver_id: '',
    user_id: '',
    amount: '',
    purpose: '',
    notes: '',
    request_date: new Date().toISOString().split('T')[0]
  });

  // Selected contexts for display
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedJobOrder, setSelectedJobOrder] = useState(null);

  useEffect(() => {
    fetchOptions();
    if (isEditMode) {
      loadAdvanceData();
    } else {
      handlePrefill();
    }
  }, [id, prefillOperationId, prefillJobOrderId]);

  const fetchOptions = async () => {
    try {
      const [opRes, joRes, drvRes, usrRes] = await Promise.all([
        api.get('/operations?status=PLANNING,READY,STARTED,ARRIVED_PICKUP,PICKED_UP,IN_TRANSIT,ARRIVED_DESTINATION'),
        api.get('/job-orders?status=CONFIRMED,IN_PROGRESS'),
        api.get('/master-data/resources/drivers?status=AVAILABLE,ON_DUTY'),
        api.get('/users')
      ]);
      if (opRes.data?.data) setOperations(opRes.data.data);
      if (joRes.data?.data) setJobOrders(joRes.data.data);
      if (drvRes.data?.data) setDrivers(drvRes.data.data);
      if (usrRes.data?.data) setUsers(usrRes.data.data);
    } catch (err) {
      console.error('Failed to fetch options', err);
    }
  };

  const handlePrefill = async () => {
    let initialData = { ...formData };
    
    if (prefillOperationId) {
      initialData.advance_scope = 'OPERATION';
      initialData.operation_id = prefillOperationId;
      try {
        const res = await api.get(`/operations/${prefillOperationId}`);
        const opData = res.data.data;
        if (opData) {
          setSelectedOperation(opData);
          if (opData.job_order_id) {
             initialData.job_order_id = opData.job_order_id.toString();
          }
          // Attempt to fetch assignment for driver
          try {
             const asgRes = await api.get(`/operations/${prefillOperationId}/assignment`);
             if (asgRes.data.data && asgRes.data.data.driver_id) {
               initialData.recipient_type = 'DRIVER';
               initialData.driver_id = asgRes.data.data.driver_id.toString();
             }
          } catch(e) {}
        }
      } catch (err) {}
    } else if (prefillJobOrderId) {
      initialData.advance_scope = 'JOB_ORDER';
      initialData.job_order_id = prefillJobOrderId;
      try {
        const res = await api.get(`/job-orders/${prefillJobOrderId}`);
        if (res.data.data) {
          setSelectedJobOrder(res.data.data);
        }
      } catch (err) {}
    }
    
    setFormData(initialData);
  };

  const loadAdvanceData = async () => {
    setIsLoading(true);
    try {
      const res = await getCashAdvanceById(id);
      if (res.status === 'success') {
        const data = res.data;
        if (data.status !== 'DRAFT') {
          showError('Hanya Draft yang dapat diedit');
          navigate('/cash-advances');
          return;
        }
        
        let recipientType = 'DRIVER';
        if (data.user_id) recipientType = 'USER';
        
        setFormData({
          advance_scope: data.advance_scope,
          job_order_id: data.job_order_id || '',
          operation_id: data.operation_id || '',
          recipient_type: recipientType,
          driver_id: data.driver_id || '',
          user_id: data.user_id || '',
          amount: data.amount || '',
          purpose: data.purpose || '',
          notes: data.notes || '',
          request_date: data.request_date ? data.request_date.split('T')[0] : ''
        });

        // Load contexts if exists
        if (data.operation_id) {
           api.get(`/operations/${data.operation_id}`).then(r => setSelectedOperation(r.data.data)).catch(e=>{});
        }
        if (data.job_order_id && data.advance_scope === 'JOB_ORDER') {
           api.get(`/job-orders/${data.job_order_id}`).then(r => setSelectedJobOrder(r.data.data)).catch(e=>{});
        }
      }
    } catch (err) {
      showError('Gagal memuat data Cash Advance');
      navigate('/cash-advances');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      let updated = { ...prev, [name]: value };

      if (name === 'advance_scope') {
        // Clear incompatibilities
        if (value === 'OPERATION') {
          updated.recipient_type = 'DRIVER';
          updated.job_order_id = '';
          updated.operation_id = '';
          updated.driver_id = '';
          updated.user_id = '';
          setSelectedOperation(null);
        } else if (value === 'JOB_ORDER') {
          updated.recipient_type = 'DRIVER';
          updated.operation_id = '';
          updated.job_order_id = '';
          updated.driver_id = '';
          updated.user_id = '';
          setSelectedJobOrder(null);
        } else if (value === 'GENERAL') {
          updated.recipient_type = 'USER';
          updated.operation_id = '';
          updated.job_order_id = '';
          updated.driver_id = '';
          updated.user_id = '';
          setSelectedOperation(null);
          setSelectedJobOrder(null);
        }
      }

      if (name === 'recipient_type') {
        updated.driver_id = '';
        updated.user_id = '';
      }

      return updated;
    });
  };

  const handleOperationSelect = async (e) => {
    const opId = e.target.value;
    setFormData(prev => ({ ...prev, operation_id: opId }));
    
    if (opId) {
      try {
        const res = await api.get(`/operations/${opId}`);
        const opData = res.data.data;
        if (opData) {
          setSelectedOperation(opData);
          setFormData(prev => ({ ...prev, job_order_id: opData.job_order_id || '' }));
          
          try {
             const asgRes = await api.get(`/operations/${opId}/assignment`);
             if (asgRes.data.data && asgRes.data.data.driver_id) {
               setFormData(prev => ({
                 ...prev, 
                 recipient_type: 'DRIVER', 
                 driver_id: asgRes.data.data.driver_id 
               }));
             }
          } catch(e) {}
        }
      } catch (err) {}
    } else {
      setSelectedOperation(null);
      setFormData(prev => ({ ...prev, job_order_id: '' }));
    }
  };

  const handleJobOrderSelect = async (e) => {
    const joId = e.target.value;
    setFormData(prev => ({ ...prev, job_order_id: joId }));
    
    if (joId) {
      try {
        const res = await api.get(`/job-orders/${joId}`);
        if (res.data.data) {
          setSelectedJobOrder(res.data.data);
        }
      } catch (err) {}
    } else {
      setSelectedJobOrder(null);
    }
  };

  const preparePayload = () => {
    let payload = {
      advance_scope: formData.advance_scope,
      amount: formData.amount,
      purpose: formData.purpose,
      notes: formData.notes,
      request_date: formData.request_date
    };

    if (formData.advance_scope === 'OPERATION') {
      payload.operation_id = formData.operation_id;
    } else if (formData.advance_scope === 'JOB_ORDER') {
      payload.job_order_id = formData.job_order_id;
    }
    
    if (formData.recipient_type === 'DRIVER') {
      payload.driver_id = formData.driver_id;
    } else {
      payload.user_id = formData.user_id;
    }

    return payload;
  };

  const handleSave = async (submitAfterSave = false) => {
    setIsSaving(true);
    try {
      const payload = preparePayload();
      
      let savedId = id;
      if (isEditMode) {
        await updateCashAdvance(id, payload);
      } else {
        const res = await createCashAdvance(payload);
        savedId = res.data.id || res.data.data?.id; // Fallback depends on standard api response structure
      }

      if (submitAfterSave && savedId) {
        try {
          await submitCashAdvance(savedId);
          showSuccess('Cash Advance berhasil disimpan dan disubmit');
          navigate(`/cash-advances/${savedId}`);
        } catch (err) {
          showError('Cash Advance disimpan sebagai Draft, tetapi gagal disubmit');
          navigate(`/cash-advances/${savedId}`);
        }
      } else {
        showSuccess('Cash Advance berhasil disimpan sebagai Draft');
        navigate(savedId ? `/cash-advances/${savedId}` : '/cash-advances');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyimpan Cash Advance');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/cash-advances')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-sky-400" />
            {isEditMode ? 'Edit Cash Advance' : 'New Cash Advance'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Isi detail pengajuan kas bon operasional</p>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Informasi Request</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Advance Scope *</label>
                <select
                  name="advance_scope"
                  value={formData.advance_scope}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="OPERATION">Operation</option>
                  <option value="JOB_ORDER">Job Order</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              {formData.advance_scope === 'OPERATION' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Operation *</label>
                  <select
                    name="operation_id"
                    value={formData.operation_id}
                    onChange={handleOperationSelect}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Pilih Operation --</option>
                    {operations.map(op => (
                      <option key={op.id} value={op.id}>{op.operation_no} - {op.job_order_number}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.advance_scope === 'JOB_ORDER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Job Order *</label>
                  <select
                    name="job_order_id"
                    value={formData.job_order_id}
                    onChange={handleJobOrderSelect}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Pilih Job Order --</option>
                    {jobOrders.map(jo => (
                      <option key={jo.id} value={jo.id}>{jo.job_order_number} - {jo.customer_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {formData.advance_scope === 'OPERATION' && selectedOperation && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div><span className="text-slate-500">Operation:</span> {selectedOperation.operation_no}</div>
                  <div><span className="text-slate-500">Job Order:</span> {selectedOperation.job_order_number}</div>
                  <div><span className="text-slate-500">Customer:</span> {selectedOperation.customer_name}</div>
                  <div><span className="text-slate-500">Tipe:</span> {selectedOperation.operation_type}</div>
                </div>
              </div>
            )}

            {formData.advance_scope === 'JOB_ORDER' && selectedJobOrder && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div><span className="text-slate-500">Job Order:</span> {selectedJobOrder.job_order_number}</div>
                  <div><span className="text-slate-500">Customer:</span> {selectedJobOrder.customer_name}</div>
                  <div><span className="text-slate-500">Tipe:</span> {selectedJobOrder.job_order_type}</div>
                  <div><span className="text-slate-500">Rute:</span> {selectedJobOrder.pickup_location} ➔ {selectedJobOrder.delivery_location}</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Penerima Dana</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.advance_scope !== 'GENERAL' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipe Penerima *</label>
                  <select
                    name="recipient_type"
                    value={formData.recipient_type}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="USER">Internal User</option>
                  </select>
                </div>
              )}

              {formData.advance_scope === 'GENERAL' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipe Penerima *</label>
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400">
                    Internal User
                  </div>
                </div>
              )}

              {formData.recipient_type === 'DRIVER' && formData.advance_scope !== 'GENERAL' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Driver *</label>
                  <select
                    name="driver_id"
                    value={formData.driver_id}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Pilih Driver --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.driver_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.recipient_type === 'USER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">User *</label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Pilih User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Detail Pembayaran</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Jumlah (IDR) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500">Rp</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-sky-500"
                    placeholder="0"
                  />
                </div>
                {formData.amount && (
                  <div className="text-xs text-sky-400 mt-1">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(formData.amount)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Request *</label>
                <input
                  type="date"
                  name="request_date"
                  value={formData.request_date}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Keperluan / Tujuan *</label>
                <Input
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Contoh: Uang Jalan, BBM, Tol, dll"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Catatan</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  rows={3}
                  placeholder="Catatan opsional..."
                />
              </div>
            </div>
          </div>
          </div>
        <div className="bg-slate-900/50 p-4 border-t border-slate-800 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={() => navigate('/cash-advances')} disabled={isSaving}>
            Batal
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSave(false)} 
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (window.confirm("Submit Cash Advance?\n\nSetelah disubmit, request tidak dapat diedit hingga diproses lebih lanjut.")) {
                handleSave(true);
              }
            }} 
            disabled={isSaving}
          >
            <Send className="w-4 h-4 mr-2" />
            Save & Submit
          </Button>
        </div>
      </Card>
    </div>
  );
}
