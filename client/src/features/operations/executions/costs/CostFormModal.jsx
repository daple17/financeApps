import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import operationCostService from '../../../../services/operationCostService';
import { masterDataService } from '../../../../services/masterDataService';
import { useToast } from '../../../../context/ToastContext';

export const COST_TYPES = {
  TRANSPORT: 'Transportation',
  FUEL: 'Fuel',
  TOLL: 'Toll',
  PARKING: 'Parking',
  LOADING_UNLOADING: 'Loading / Unloading',
  DRIVER_ALLOWANCE: 'Driver Allowance',
  VENDOR_COST: 'Vendor Cost',
  OTHER: 'Other Operational Cost'
};

export default function CostFormModal({ operationId, existingCost, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState([]);
  
  const [formData, setFormData] = useState({
    cost_type: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    reference_no: '',
    notes: ''
  });

  useEffect(() => {
    fetchVendors();
    if (existingCost) {
      setFormData({
        cost_type: existingCost.cost_type || '',
        description: existingCost.description || '',
        amount: existingCost.amount || '',
        transaction_date: existingCost.transaction_date ? new Date(existingCost.transaction_date).toISOString().split('T')[0] : '',
        vendor_id: existingCost.vendor_id || '',
        reference_no: existingCost.reference_no || '',
        notes: existingCost.notes || ''
      });
    }
  }, [existingCost]);

  const fetchVendors = async () => {
    try {
      const response = await masterDataService.getAllBusinessPartners({ role: 'VENDOR' });
      if (response.status === 'success') {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.amount) <= 0) {
      showError('Amount harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.vendor_id) delete payload.vendor_id;

      if (existingCost) {
        await operationCostService.update(existingCost.id, payload);
        showSuccess('Biaya operasional berhasil diperbarui');
      } else {
        await operationCostService.create(operationId, payload);
        showSuccess('Biaya operasional berhasil ditambahkan');
      }
      onSuccess();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal menyimpan biaya operasional');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {existingCost ? 'Edit Biaya Operasional' : 'Tambah Biaya Operasional'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Cost Type <span className="text-rose-500">*</span></label>
              <select 
                name="cost_type"
                value={formData.cost_type}
                onChange={handleChange}
                required
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Pilih Tipe Biaya</option>
                {Object.entries(COST_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Description <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Deskripsi pengeluaran"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Amount (IDR) <span className="text-rose-500">*</span></label>
              <input 
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="1"
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Transaction Date <span className="text-rose-500">*</span></label>
              <input 
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleChange}
                required
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Vendor (Opsional)</label>
              <select 
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Tanpa Vendor --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.partner_name} ({v.partner_code})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Reference Number (Opsional)</label>
              <input 
                type="text"
                name="reference_no"
                value={formData.reference_no}
                onChange={handleChange}
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="No kwitansi, invoice, dll."
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Notes (Opsional)</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" /> Simpan Biaya
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
