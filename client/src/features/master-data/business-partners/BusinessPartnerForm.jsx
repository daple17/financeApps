import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, X, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ROLES = [
  { id: 'CUSTOMER', label: 'Customer' },
  { id: 'VENDOR', label: 'Vendor' },
  { id: 'SHIPPER', label: 'Shipper' },
  { id: 'SHIPPING_AGENT', label: 'Shipping Agent' },
  { id: 'SHIPPING_COMPANY', label: 'Shipping Company' }
];

export default function BusinessPartnerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  
  // Determine context based on route
  const formContext = location.pathname.includes('/customers') ? 'customer' 
                    : location.pathname.includes('/vendors') ? 'vendor' 
                    : 'partner';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    partner_code: '',
    partner_name: '',
    short_name: '',
    partner_type: 'COMPANY',
    email: '',
    phone: '',
    city: '',
    address: '',
    npwp: '',
    status: 'ACTIVE',
    roles: [],
    contacts: []
  });

  useEffect(() => {
    // If not editing, check if we came from /customers or /vendors to pre-check role
    if (!isEdit) {
      if (location.pathname.includes('/customers')) {
        setFormData(prev => ({ ...prev, roles: ['CUSTOMER'] }));
      } else if (location.pathname.includes('/vendors')) {
        setFormData(prev => ({ ...prev, roles: ['VENDOR'] }));
      }
    } else {
      loadPartner();
    }
  }, [id, isEdit, location.pathname]);

  const loadPartner = async () => {
    try {
      setLoading(true);
      const data = await masterDataService.getBusinessPartnerById(id);
      setFormData({
        ...data,
        roles: data.roles || [],
        contacts: data.contacts || []
      });
    } catch (err) {
      setError(err.message || 'Gagal memuat data partner');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(roleId)) {
        return { ...prev, roles: currentRoles.filter(r => r !== roleId) };
      } else {
        return { ...prev, roles: [...currentRoles, roleId] };
      }
    });
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          _tempId: Date.now(),
          name: '',
          position: '',
          phone: '',
          email: '',
          is_primary: prev.contacts.length === 0,
          status: 'ACTIVE'
        }
      ]
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => {
      const newContacts = [...prev.contacts];
      newContacts.splice(index, 1);
      // If we removed the primary, make the first one primary
      if (newContacts.length > 0 && !newContacts.some(c => c.is_primary)) {
        newContacts[0].is_primary = true;
      }
      return { ...prev, contacts: newContacts };
    });
  };

  const updateContact = (index, field, value) => {
    setFormData(prev => {
      const newContacts = [...prev.contacts];
      newContacts[index] = { ...newContacts[index], [field]: value };
      return { ...prev, contacts: newContacts };
    });
  };

  const setPrimaryContact = (index) => {
    setFormData(prev => {
      const newContacts = prev.contacts.map((c, i) => ({
        ...c,
        is_primary: i === index
      }));
      return { ...prev, contacts: newContacts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.roles.length === 0) {
      setError('Minimal satu Role harus dipilih');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (isEdit) {
        await masterDataService.updateBusinessPartner(id, formData);
      } else {
        await masterDataService.createBusinessPartner(formData);
      }
      // Go back to the correct list
      if (location.pathname.includes('/customers')) navigate('/master-data/customers');
      else if (location.pathname.includes('/vendors')) navigate('/master-data/vendors');
      else navigate('/master-data/business-partners');
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEdit 
                ? (formContext === 'customer' ? 'Edit Customer' : formContext === 'vendor' ? 'Edit Vendor' : 'Edit Business Partner')
                : (formContext === 'customer' ? 'Tambah Customer' : formContext === 'vendor' ? 'Tambah Vendor' : 'Tambah Business Partner')
              }
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? formData.partner_name : `Buat data ${formContext === 'customer' ? 'customer' : formContext === 'vendor' ? 'vendor' : 'partner'} baru`}
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

      {/* General Information & Roles */}
      <div className={`grid grid-cols-1 ${formContext === 'partner' ? 'lg:grid-cols-3' : ''} gap-6`}>
        <div className={`${formContext === 'partner' ? 'lg:col-span-2' : ''} space-y-6`}>
          <Card>
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. General Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input 
                label={formContext === 'customer' ? 'Customer Code' : formContext === 'vendor' ? 'Vendor Code' : 'Partner Code'} 
                name="partner_code" value={formData.partner_code} onChange={handleChange} required placeholder="Misal: CUST-001" 
              />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-medium text-slate-300">Partner Type</label>
                <select name="partner_type" value={formData.partner_type} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50">
                  <option value="COMPANY">Company / PT / CV</option>
                  <option value="INDIVIDUAL">Individual / Perorangan</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <Input 
                  label={formContext === 'customer' ? 'Customer Name' : formContext === 'vendor' ? 'Vendor Name' : 'Partner Name (Nama Perusahaan / Individu)'} 
                  name="partner_name" value={formData.partner_name} onChange={handleChange} required placeholder="Misal: PT Logistik Sukses" 
                />
              </div>
              
              <Input label="Short Name / Alias" name="short_name" value={formData.short_name} onChange={handleChange} placeholder="Misal: LST" />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-medium text-slate-300">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Contact & Location</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input label="Email Perusahaan" name="email" type="email" value={formData.email} onChange={handleChange} />
              <Input label="Phone Perusahaan" name="phone" value={formData.phone} onChange={handleChange} />
              
              <Input label="City" name="city" value={formData.city} onChange={handleChange} />
              <Input label="NPWP" name="npwp" value={formData.npwp} onChange={handleChange} placeholder="Misal: 01.234.567.8-901.000" />
              
              <div className="md:col-span-2 flex flex-col gap-1.5 w-full">
                <label className="text-xs font-medium text-slate-300">Alamat Lengkap</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"></textarea>
              </div>
            </div>
          </Card>
        </div>

        {/* Roles Sidebar (Only visible in Business Partner context) */}
        {formContext === 'partner' && (
          <div className="space-y-6">
            <Card>
              <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Roles (Multi-Select)</h3>
                <p className="text-xs text-slate-400 mt-1">Satu partner dapat memiliki lebih dari satu peran.</p>
              </div>
              <div className="p-4 space-y-2">
                {ROLES.map(role => (
                  <label key={role.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-sky-500 rounded border-slate-600 bg-slate-900 focus:ring-sky-500"
                      checked={formData.roles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                    />
                    <span className="text-sm font-medium text-slate-200">{role.label}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Contacts Person */}
      <Card>
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Contact Persons (PIC)</h3>
          <Button type="button" variant="secondary" onClick={addContact} className="py-1.5 px-3 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah PIC
          </Button>
        </div>
        <div className="p-6">
          {formData.contacts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
              Belum ada PIC yang ditambahkan. <button type="button" onClick={addContact} className="text-sky-400 hover:underline">Tambah sekarang</button>.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.contacts.map((contact, index) => (
                <div key={contact.id || contact._tempId} className={`p-4 rounded-xl border ${contact.is_primary ? 'border-sky-500/50 bg-sky-900/10' : 'border-slate-700 bg-slate-800/50'}`}>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                      <Input label="Nama PIC" value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} required />
                      <Input label="Posisi / Dept" value={contact.position || ''} onChange={(e) => updateContact(index, 'position', e.target.value)} />
                      <Input label="No. Handphone" value={contact.phone || ''} onChange={(e) => updateContact(index, 'phone', e.target.value)} />
                      <Input label="Email" type="email" value={contact.email || ''} onChange={(e) => updateContact(index, 'email', e.target.value)} />
                    </div>

                    <div className="flex items-center gap-3 pt-6 shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer mr-2">
                        <input type="radio" name="primary_contact" className="text-sky-500 bg-slate-900 border-slate-600 focus:ring-sky-500"
                          checked={contact.is_primary}
                          onChange={() => setPrimaryContact(index)}
                        />
                        <span className="text-xs text-slate-400">Primary</span>
                      </label>
                      <button type="button" onClick={() => removeContact(index)} className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

    </form>
  );
}
