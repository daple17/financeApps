import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    vehicle_code: '',
    plate_number: '',
    vehicle_type_id: '',
    ownership_type: 'COMPANY_OWNED',
    vendor_id: '',
    capacity_weight: '',
    capacity_volume: '',
    status: 'AVAILABLE',
    notes: ''
  });

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initFetch = async () => {
      try {
        const [typesData, vendorsData] = await Promise.all([
          masterDataService.getVehicleTypes({ status: 'ACTIVE' }),
          masterDataService.getAllBusinessPartners({ status: 'ACTIVE' }) // Fetching all active partners, or ideally role=VENDOR if supported
        ]);
        
        setVehicleTypes(typesData || []);
        setVendors(vendorsData.data || []);

        if (isEdit) {
          const data = await masterDataService.getVehicleById(id);
          if (data.data) {
            setFormData({
              vehicle_code: data.data.vehicle_code,
              plate_number: data.data.plate_number,
              vehicle_type_id: data.data.vehicle_type_id || '',
              ownership_type: data.data.ownership_type || 'COMPANY_OWNED',
              vendor_id: data.data.vendor_id || '',
              capacity_weight: data.data.capacity_weight || '',
              capacity_volume: data.data.capacity_volume || '',
              status: data.data.status,
              notes: data.data.notes || ''
            });
          }
        }
      } catch (err) {
        setError('Gagal memuat data form');
      } finally {
        setFetching(false);
      }
    };
    initFetch();
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
      const payload = {
        ...formData,
        vendor_id: formData.ownership_type === 'VENDOR' ? parseInt(formData.vendor_id) : null,
        capacity_weight: formData.capacity_weight ? parseFloat(formData.capacity_weight) : null,
        capacity_volume: formData.capacity_volume ? parseFloat(formData.capacity_volume) : null,
      };

      if (isEdit) {
        await masterDataService.updateVehicle(id, payload);
      } else {
        await masterDataService.createVehicle(payload);
      }
      navigate('/master-data/vehicles');
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
          onClick={() => navigate('/master-data/vehicles')}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <Truck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Vehicle' : 'Tambah Vehicle'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? 'Ubah informasi kendaraan' : 'Tambahkan kendaraan baru ke sistem'}
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
                Vehicle Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="vehicle_code"
                value={formData.vehicle_code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Contoh: TRK-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Plate Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="plate_number"
                value={formData.plate_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Contoh: B 1234 CD"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Vehicle Type <span className="text-rose-400">*</span>
              </label>
              <select
                name="vehicle_type_id"
                value={formData.vehicle_type_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Pilih Tipe Kendaraan</option>
                {vehicleTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Ownership Type <span className="text-rose-400">*</span>
              </label>
              <select
                name="ownership_type"
                value={formData.ownership_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              >
                <option value="COMPANY_OWNED">Company Owned</option>
                <option value="VENDOR">Vendor</option>
                <option value="RENTAL">Rental</option>
              </select>
            </div>
            
            {formData.ownership_type === 'VENDOR' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Vendor Owner <span className="text-rose-400">*</span>
                </label>
                <select
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">Pilih Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.partner_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Capacity Weight (KG)
              </label>
              <input
                type="number"
                step="0.01"
                name="capacity_weight"
                value={formData.capacity_weight}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Contoh: 8000"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Capacity Volume (CBM)
              </label>
              <input
                type="number"
                step="0.01"
                name="capacity_volume"
                value={formData.capacity_volume}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                placeholder="Contoh: 15"
              />
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
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
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
              onClick={() => navigate('/master-data/vehicles')}
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
