import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function CountryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    country_code: '',
    country_name: '',
    iso2: '',
    iso3: '',
    phone_code: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isEdit) {
      const fetchCountry = async () => {
        try {
          const data = await masterDataService.getCountryById(id);
          setFormData({
            country_code: data.country_code || '',
            country_name: data.country_name || '',
            iso2: data.iso2 || '',
            iso3: data.iso3 || '',
            phone_code: data.phone_code || '',
            status: data.status || 'ACTIVE'
          });
        } catch (err) {
          setError('Gagal memuat data country');
        } finally {
          setLoading(false);
        }
      };
      fetchCountry();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (isEdit) {
        await masterDataService.updateCountry(id, formData);
      } else {
        await masterDataService.createCountry(formData);
      }
      navigate('/master-data/countries');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan');
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
              {isEdit ? 'Edit Country' : 'Tambah Country'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? formData.country_name : 'Buat master data negara baru'}
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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Negara</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Input 
            label="Country Code" 
            name="country_code" 
            value={formData.country_code} 
            onChange={handleChange} 
            required 
            placeholder="Misal: ID" 
          />
          <Input 
            label="Country Name" 
            name="country_name" 
            value={formData.country_name} 
            onChange={handleChange} 
            required 
            placeholder="Misal: Indonesia" 
          />
          
          <Input 
            label="ISO 2 Code" 
            name="iso2" 
            value={formData.iso2} 
            onChange={handleChange} 
            placeholder="Misal: ID" 
          />
          <Input 
            label="ISO 3 Code" 
            name="iso3" 
            value={formData.iso3} 
            onChange={handleChange} 
            placeholder="Misal: IDN" 
          />
          
          <Input 
            label="Phone Code" 
            name="phone_code" 
            value={formData.phone_code} 
            onChange={handleChange} 
            placeholder="Misal: +62" 
          />
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
