import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    driver_code: '',
    driver_name: '',
    phone_number: '',
    license_number: '',
    license_type: '',
    license_expiry_date: '',
    employment_type: 'INTERNAL',
    status: 'ACTIVE',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchDriver = async () => {
        try {
          const data = await masterDataService.getDriverById(id);
          if (data.data) {
            setFormData({
              driver_code: data.data.driver_code,
              driver_name: data.data.driver_name,
              phone_number: data.data.phone_number || '',
              license_number: data.data.license_number || '',
              license_type: data.data.license_type || '',
              license_expiry_date: data.data.license_expiry_date ? data.data.license_expiry_date.split('T')[0] : '',
              employment_type: data.data.employment_type || 'INTERNAL',
              status: data.data.status,
              notes: data.data.notes || ''
            });
          }
        } catch (err) {
          setError('Gagal memuat data driver');
        } finally {
          setFetching(false);
        }
      };
      fetchDriver();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await masterDataService.updateDriver(id, formData);
      } else {
        await masterDataService.createDriver(formData);
      }
      navigate('/master-data/drivers');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/master-data/drivers')}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <User className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Driver' : 'Tambah Driver'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? 'Ubah informasi driver' : 'Tambahkan driver baru ke sistem'}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Driver Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="driver_code"
                value={formData.driver_code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Contoh: DRV-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Driver Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="driver_name"
                value={formData.driver_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Nama lengkap pengemudi"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Nomor telepon aktif"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                License Type (SIM)
              </label>
              <select
                name="license_type"
                value={formData.license_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Pilih Tipe SIM --</option>
                <option value="A">A</option>
                <option value="A Umum">A Umum</option>
                <option value="B1">B1</option>
                <option value="B1 Umum">B1 Umum</option>
                <option value="B2">B2</option>
                <option value="B2 Umum">B2 Umum</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                License Number
              </label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Nomor SIM"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                License Expiry Date
              </label>
              <input
                type="date"
                name="license_expiry_date"
                value={formData.license_expiry_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Employment Type
              </label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              >
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External / Freelance</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              placeholder="Catatan tambahan (opsional)..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => navigate('/master-data/drivers')}
              disabled={loading}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="bg-sky-500 hover:bg-sky-400 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  Menyimpan...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Simpan
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
