import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const JOB_TYPES = [
  { value: 'IMPORT', label: 'Import' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'TRUCKING', label: 'Trucking' },
  { value: 'PROJECT', label: 'Project' }
];

export default function ServiceTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    applicable_job_types: [],
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isEdit) {
      const fetchItem = async () => {
        try {
          const data = await masterDataService.getServiceTypeById(id);
          setFormData({
            code: data.code || '',
            name: data.name || '',
            description: data.description || '',
            applicable_job_types: data.applicable_job_types || [],
            status: data.status || 'ACTIVE'
          });
        } catch (err) {
          setError('Gagal memuat data service type');
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (jobType) => {
    setFormData(prev => {
      const current = [...prev.applicable_job_types];
      if (current.includes(jobType)) {
        return { ...prev, applicable_job_types: current.filter(t => t !== jobType) };
      } else {
        return { ...prev, applicable_job_types: [...current, jobType] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (isEdit) {
        await masterDataService.updateServiceType(id, formData);
      } else {
        await masterDataService.createServiceType(formData);
      }
      navigate('/master-data/service-types');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Memuat form...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Service Type' : 'Tambah Service Type'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? formData.name : 'Buat referensi tipe layanan baru'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            <X className="w-4 h-4 mr-2" /> Batal
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      <Card>
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Service Type</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Input 
            label="Code" 
            name="code" 
            value={formData.code} 
            onChange={handleChange} 
            required 
            placeholder="Misal: CUSTOMS-CLEARANCE" 
          />
          <Input 
            label="Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            placeholder="Misal: Customs Clearance" 
          />
          
          <div className="md:col-span-2 flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Applicable Job Types</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {JOB_TYPES.map(type => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    formData.applicable_job_types.includes(type.value) 
                      ? 'bg-sky-500 border-sky-500' 
                      : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'
                  }`}>
                    {formData.applicable_job_types.includes(type.value) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input 
                    type="checkbox"
                    className="hidden"
                    checked={formData.applicable_job_types.includes(type.value)}
                    onChange={() => handleCheckboxChange(type.value)}
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Input 
              label="Description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Deskripsi opsional..." 
            />
          </div>
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Status</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </Card>
    </form>
  );
}
