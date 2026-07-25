import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { useToast } from '../../../../context/ToastContext';
import operationService from '../../../../services/operationService';

export default function PodSubmissionModal({ operationId, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_company: '',
    recipient_phone: '',
    delivery_date: '',
    delivery_time: '',
    received_condition: 'Good',
    delivery_notes: ''
  });
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showError('File bukti pengiriman (Evidence) wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      payload.append(key, formData[key]);
    });
    payload.append('file', file);

    try {
      await operationService.submitPod(operationId, payload);
      showSuccess('Proof of Delivery berhasil disubmit');
      onSuccess();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal submit POD');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-white">Submit Proof of Delivery</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nama Penerima <span className="text-rose-500">*</span></label>
                <input 
                  type="text" name="recipient_name" required
                  value={formData.recipient_name} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Nama jelas penerima barang"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Perusahaan Penerima</label>
                <input 
                  type="text" name="recipient_company"
                  value={formData.recipient_company} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="(Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telepon Penerima</label>
                <input 
                  type="text" name="recipient_phone"
                  value={formData.recipient_phone} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="(Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kondisi Barang <span className="text-rose-500">*</span></label>
                <select 
                  name="received_condition" required
                  value={formData.received_condition} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Good">Good (Baik)</option>
                  <option value="Damaged">Damaged (Rusak)</option>
                  <option value="Partial Delivery">Partial Delivery (Parsial)</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Pengiriman <span className="text-rose-500">*</span></label>
                <input 
                  type="date" name="delivery_date" required
                  value={formData.delivery_date} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Waktu Pengiriman <span className="text-rose-500">*</span></label>
                <input 
                  type="time" name="delivery_time" required
                  value={formData.delivery_time} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Catatan Tambahan</label>
              <textarea 
                name="delivery_notes" rows="2"
                value={formData.delivery_notes} onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="(Opsional) Catatan khusus terkait pengiriman"
              />
            </div>

            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 border-dashed">
              <label className="block text-sm font-medium text-white mb-2">File Bukti Pengiriman (Evidence) <span className="text-rose-500">*</span></label>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-sky-500/10 file:text-sky-400
                  hover:file:bg-sky-500/20 transition-all cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-2">Mendukung PDF, JPG, PNG (Max 5MB). Lampirkan foto dokumen POD atau foto penerima.</p>
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20 rounded-b-2xl">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting}>
              <Upload className="w-4 h-4 mr-2" /> Submit POD
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
