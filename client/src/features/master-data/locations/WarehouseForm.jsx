import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function WarehouseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [countries, setCountries] = useState([]);
  const [businessPartners, setBusinessPartners] = useState([]);

  const [formData, setFormData] = useState({
    warehouse_code: '',
    warehouse_name: '',
    warehouse_type: 'OWN',
    country_id: '',
    city: '',
    address: '',
    contact_person: '',
    phone: '',
    email: '',
    business_partner_id: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [countriesData, bpData] = await Promise.all([
          masterDataService.getAllCountries({ status: 'ACTIVE' }),
          masterDataService.getAllBusinessPartners({ status: 'ACTIVE' })
        ]);
        setCountries(countriesData);
        setBusinessPartners(bpData);
      } catch (err) {
        console.error('Failed to load dependencies');
      }
    };
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchWarehouse = async () => {
        try {
          const data = await masterDataService.getWarehouseById(id);
          setFormData({
            warehouse_code: data.warehouse_code || '',
            warehouse_name: data.warehouse_name || '',
            warehouse_type: data.warehouse_type || 'OWN',
            country_id: data.country_id || '',
            city: data.city || '',
            address: data.address || '',
            contact_person: data.contact_person || '',
            phone: data.phone || '',
            email: data.email || '',
            business_partner_id: data.business_partner_id || '',
            status: data.status || 'ACTIVE'
          });
        } catch (err) {
          setError('Gagal memuat data warehouse');
        } finally {
          setLoading(false);
        }
      };
      fetchWarehouse();
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
      // Clean up empty string to null for foreign key
      const submitData = { ...formData };
      if (submitData.business_partner_id === '') {
        submitData.business_partner_id = null;
      }

      if (isEdit) {
        await masterDataService.updateWarehouse(id, submitData);
      } else {
        await masterDataService.createWarehouse(submitData);
      }
      navigate('/master-data/warehouses');
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
              {isEdit ? 'Edit Warehouse' : 'Tambah Warehouse'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? formData.warehouse_name : 'Buat master data gudang baru'}
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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Warehouse</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Input 
            label="Warehouse Code" 
            name="warehouse_code" 
            value={formData.warehouse_code} 
            onChange={handleChange} 
            required 
            placeholder="Misal: WH-JKT-01" 
          />
          <Input 
            label="Warehouse Name" 
            name="warehouse_name" 
            value={formData.warehouse_name} 
            onChange={handleChange} 
            required 
            placeholder="Misal: Gudang Utama Jakarta" 
          />
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Warehouse Type <span className="text-rose-500">*</span></label>
            <select 
              name="warehouse_type" 
              value={formData.warehouse_type} 
              onChange={handleChange} 
              required
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="OWN">Own (Milik Sendiri)</option>
              <option value="CUSTOMER">Customer</option>
              <option value="VENDOR">Vendor</option>
              <option value="PUBLIC">Public</option>
              <option value="BONDED">Bonded (Berikat)</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-slate-300">Pemilik (Business Partner)</label>
            <select 
              name="business_partner_id" 
              value={formData.business_partner_id} 
              onChange={handleChange} 
              className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">- Tidak ada / Milik Sendiri -</option>
              {businessPartners.map(bp => (
                <option key={bp.id} value={bp.id}>{bp.partner_name}</option>
              ))}
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
            placeholder="Misal: Jakarta Utara" 
          />
          
          <Input 
            label="Contact Person" 
            name="contact_person" 
            value={formData.contact_person} 
            onChange={handleChange} 
            placeholder="Nama Penanggung Jawab" 
          />
          <Input 
            label="Telepon" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            placeholder="Misal: 08123456789" 
          />
          <Input 
            label="Email" 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={handleChange} 
            placeholder="Email gudang / PIC" 
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
            <label className="text-xs font-medium text-slate-300">Alamat Lengkap</label>
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
