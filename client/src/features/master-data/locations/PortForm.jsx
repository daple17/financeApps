import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function PortForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [countries, setCountries] = useState([]);

  const [formData, setFormData] = useState({
    port_code: '',
    port_name: '',
    port_type: 'SEA_PORT',
    trade_scope: 'INTERNATIONAL',
    country_id: '',
    city: '',
    un_locode: '',
    address: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await masterDataService.getAllCountries({ status: 'ACTIVE' });
        setCountries(data);
      } catch (err) {
        console.error('Failed to load countries');
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchPort = async () => {
        try {
          const data = await masterDataService.getPortById(id);
          setFormData({
            port_code: data.port_code || '',
            port_name: data.port_name || '',
            port_type: data.port_type || 'SEA_PORT',
            trade_scope: data.trade_scope || 'INTERNATIONAL',
            country_id: data.country_id || '',
            city: data.city || '',
            un_locode: data.un_locode || '',
            address: data.address || '',
            status: data.status || 'ACTIVE'
          });
        } catch (err) {
          setError('Gagal memuat data port');
        } finally {
          setLoading(false);
        }
      };
      fetchPort();
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
        await masterDataService.updatePort(id, formData);
      } else {
        await masterDataService.createPort(formData);
      }
      navigate('/master-data/ports');
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
              {isEdit ? 'Edit Port' : 'Tambah Port'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? formData.port_name : 'Buat master data port / bandara baru'}
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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Port</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Input 
            label="Port Code" 
            name="port_code" 
            value={formData.port_code} 
            onChange={handleChange} 
            required 
            placeholder="Misal: IDTPP" 
          />
          <Input 
            label="Port Name" 
            name="port_name" 
            value={formData.port_name} 
            onChange={handleChange} 
            required 
            placeholder="Misal: Tanjung Priok Port" 
          />
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Port Type <span className="text-rose-500">*</span></label>
            <select 
              name="port_type" 
              value={formData.port_type} 
              onChange={handleChange} 
              required
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="SEA_PORT">Sea Port (Pelabuhan Laut)</option>
              <option value="AIRPORT">Airport (Bandara)</option>
              <option value="INLAND_PORT">Inland Port (Pelabuhan Darat)</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Trade Scope <span className="text-rose-500">*</span></label>
            <select 
              name="trade_scope" 
              value={formData.trade_scope} 
              onChange={handleChange} 
              required
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="INTERNATIONAL">International</option>
              <option value="DOMESTIC">Domestic</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Negara <span className="text-rose-500">*</span></label>
            <select 
              name="country_id" 
              value={formData.country_id} 
              onChange={handleChange} 
              required
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">Pilih Negara</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.country_name}</option>
              ))}
            </select>
          </div>
          <Input 
            label="City / Kota" 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            placeholder="Misal: Jakarta" 
          />

          <Input 
            label="UN/LOCODE" 
            name="un_locode" 
            value={formData.un_locode} 
            onChange={handleChange} 
            placeholder="Misal: IDTPP" 
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

          <div className="md:col-span-2 flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Alamat (Opsional)</label>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              rows="3" 
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            ></textarea>
          </div>
        </div>
      </Card>
    </form>
  );
}
