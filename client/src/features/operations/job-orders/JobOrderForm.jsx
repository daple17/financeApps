import React, { useState, useEffect } from 'react';
import { Save, FileCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function JobOrderForm({ initialData = null, isEdit = false }) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    job_order_type: '',
    export_details: {},
    import_details: {},
    trucking_details: { containers: [] },
    job_date: new Date().toISOString().slice(0, 10),
    customer_name: '',
    customer_reference: '',
    customer_pic: '',
    customer_phone: '',
    service_type: '',
    pickup_location: '',
    pickup_address: '',
    pickup_date: '',
    delivery_location: '',
    delivery_address: '',
    delivery_target_date: '',
    cargo_type: '',
    cargo_description: '',
    cargo_quantity: '',
    cargo_unit: '',
    cargo_weight: '',
    cargo_volume: '',
    vehicle_type_requirement: '',
    vehicle_quantity: '',
    special_instruction: '',
    internal_notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        job_order_type: initialData.job_order_type || '',
        export_details: initialData.export_details || {},
        import_details: initialData.import_details || {},
        trucking_details: initialData.trucking_details || { containers: [] },
        job_date: initialData.job_date ? new Date(initialData.job_date).toISOString().slice(0, 10) : '',
        pickup_date: initialData.pickup_date ? new Date(initialData.pickup_date).toISOString().slice(0, 16) : '',
        delivery_target_date: initialData.delivery_target_date ? new Date(initialData.delivery_target_date).toISOString().slice(0, 16) : '',
      });
    }
  }, [initialData]);

  const handleTypeChange = (type) => {
    if (formData.job_order_type === 'EXPORT' && type !== 'EXPORT' && Object.keys(formData.export_details).length > 0) {
      const confirmMsg = "Anda telah mengisi Detail Export. Mengubah tipe Job Order dapat menghapus data khusus Export yang telah diisi. Lanjutkan?";
      if (!window.confirm(confirmMsg)) return;
    }
    
    if (formData.job_order_type === 'IMPORT' && type !== 'IMPORT' && Object.keys(formData.import_details).length > 0) {
      const confirmMsg = "Anda telah mengisi Detail Import. Mengubah tipe Job Order dapat menghapus data khusus Import yang telah diisi. Lanjutkan?";
      if (!window.confirm(confirmMsg)) return;
    }

    if (formData.job_order_type === 'TRUCKING' && type !== 'TRUCKING' && (formData.trucking_details.bl_number || formData.trucking_details.vessel || formData.trucking_details.party_volume_type)) {
      const confirmMsg = "Anda telah mengisi Detail Trucking. Mengubah tipe Job Order dapat menghapus data khusus Trucking yang telah diisi. Lanjutkan?";
      if (!window.confirm(confirmMsg)) return;
    }
    
    setFormData(prev => ({
      ...prev,
      job_order_type: type,
      export_details: type === 'EXPORT' ? prev.export_details : {},
      import_details: type === 'IMPORT' ? prev.import_details : {},
      trucking_details: type === 'TRUCKING' ? prev.trucking_details : { containers: [] }
    }));
  };

  const handleExportDetailChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'party_volume_type' && value === 'LCL/BB' && formData.export_details.party_volume_type === 'FCL') {
      const { container_20_qty, container_40_qty, container_45_qty, container_ot_qty, container_fr_qty } = formData.export_details;
      if (Number(container_20_qty) > 0 || Number(container_40_qty) > 0 || Number(container_45_qty) > 0 || Number(container_ot_qty) > 0 || Number(container_fr_qty) > 0) {
        if (!window.confirm("Data container telah diisi. Mengubah Party / Volume ke LCL/BB dapat menghapus data container. Lanjutkan?")) {
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        export_details: {
          ...prev.export_details,
          [name]: value,
          container_20_qty: '',
          container_40_qty: '',
          container_45_qty: '',
          container_ot_qty: '',
          container_fr_qty: ''
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      export_details: {
        ...prev.export_details,
        [name]: value
      }
    }));
  };

  const handleImportDetailChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'party_volume_type' && value === 'LCL/BB' && formData.import_details.party_volume_type === 'FCL') {
      const { container_20_qty, container_40_qty, container_45_qty, container_ot_qty, container_fr_qty } = formData.import_details;
      if (Number(container_20_qty) > 0 || Number(container_40_qty) > 0 || Number(container_45_qty) > 0 || Number(container_ot_qty) > 0 || Number(container_fr_qty) > 0) {
        if (!window.confirm("Data container telah diisi. Mengubah Party / Volume ke LCL/BB dapat menghapus data container. Lanjutkan?")) {
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        import_details: {
          ...prev.import_details,
          [name]: value,
          container_20_qty: '',
          container_40_qty: '',
          container_45_qty: '',
          container_ot_qty: '',
          container_fr_qty: ''
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      import_details: {
        ...prev.import_details,
        [name]: value
      }
    }));
  };

  const handleTruckingDetailChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'party_volume_type' && value === 'LCL/BB' && formData.trucking_details.party_volume_type === 'FCL') {
      const { containers } = formData.trucking_details;
      if (containers && containers.length > 0) {
        if (!window.confirm("Data container telah diisi. Mengubah Party / Volume ke LCL/BB dapat menghapus data container. Lanjutkan?")) {
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        trucking_details: {
          ...prev.trucking_details,
          [name]: value,
          containers: []
        }
      }));
      return;
    }
    
    if (name === 'party_volume_type' && value === 'FCL' && formData.trucking_details.party_volume_type === 'LCL/BB') {
      const { weight, volume, quantity } = formData.trucking_details;
      if (weight || volume || quantity) {
        if (!window.confirm("Data cargo telah diisi. Mengubah Party / Volume ke FCL dapat menghapus data cargo. Lanjutkan?")) {
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        trucking_details: {
          ...prev.trucking_details,
          [name]: value,
          weight: '',
          volume: '',
          quantity: '',
          unit: ''
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      trucking_details: {
        ...prev.trucking_details,
        [name]: value
      }
    }));
  };

  const handleTruckingContainerChange = (index, field, value) => {
    setFormData(prev => {
      const newContainers = [...(prev.trucking_details.containers || [])];
      newContainers[index] = { ...newContainers[index], [field]: value };
      return {
        ...prev,
        trucking_details: {
          ...prev.trucking_details,
          containers: newContainers
        }
      };
    });
  };

  const addTruckingContainer = () => {
    setFormData(prev => ({
      ...prev,
      trucking_details: {
        ...prev.trucking_details,
        containers: [...(prev.trucking_details.containers || []), { type: '', quantity: 1 }]
      }
    }));
  };

  const removeTruckingContainer = (index) => {
    setFormData(prev => {
      const newContainers = [...(prev.trucking_details.containers || [])];
      newContainers.splice(index, 1);
      return {
        ...prev,
        trucking_details: {
          ...prev.trucking_details,
          containers: newContainers
        }
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (status) => {
    setIsSubmitting(true);
    try {
      const payload = { ...formData, job_status: status };
      
      if (status !== 'DRAFT' && !payload.job_order_type) {
        showError('Tipe Job Order wajib dipilih sebelum Konfirmasi');
        setIsSubmitting(false);
        return;
      }
      
      // Formatting numbers
      if (payload.cargo_quantity) payload.cargo_quantity = Number(payload.cargo_quantity);
      if (payload.cargo_weight) payload.cargo_weight = Number(payload.cargo_weight);
      if (payload.cargo_volume) payload.cargo_volume = Number(payload.cargo_volume);
      if (payload.vehicle_quantity) payload.vehicle_quantity = Number(payload.vehicle_quantity);

      let res;
      if (isEdit) {
        res = await api.put(`/job-orders/${initialData.id}`, payload);
        showSuccess('Job Order berhasil diperbarui.');
        navigate(`/job-orders/${initialData.id}`);
      } else {
        res = await api.post('/job-orders', payload);
        showSuccess(`Job Order ${res.data.data.job_order_number} berhasil dibuat.`);
        navigate(`/job-orders/${res.data.data.id}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan Job Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isEdit ? `Edit Job Order - ${initialData?.job_order_number}` : 'Buat Job Order Baru'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Lengkapi informasi pekerjaan operasional logistik di bawah ini.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION: TIPE JOB ORDER */}
        <Card>
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tipe Job Order</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['IMPORT', 'EXPORT', 'TRUCKING', 'PROJECT'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`flex items-center justify-center py-3 px-4 rounded-xl border font-semibold text-sm transition-colors ${
                    formData.job_order_type === type
                      ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* SECTION 1 */}
        <Card>
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Informasi Job</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Nomor Job Order" value={isEdit ? initialData.job_order_number : 'Auto Generated'} disabled />
            <Input label="Tanggal Job" type="date" name="job_date" value={formData.job_date} onChange={handleChange} required />
            <Input label="Customer" name="customer_name" value={formData.customer_name} onChange={handleChange} required />
            <Input label="Customer Reference" name="customer_reference" value={formData.customer_reference} onChange={handleChange} />
            <Input label="PIC Customer" name="customer_pic" value={formData.customer_pic} onChange={handleChange} />
            <Input label="No. Telepon PIC" name="customer_phone" value={formData.customer_phone} onChange={handleChange} />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Jenis Layanan</label>
              <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                name="service_type" value={formData.service_type} onChange={handleChange} required>
                <option value="">Pilih Layanan</option>
                <option value="Trucking">Trucking</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup">Pickup</option>
                <option value="Distribution">Distribution</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* SECTION 2 */}
        <Card>
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Informasi Pengiriman</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-2">Lokasi Pickup</h4>
              <Input label="Nama Lokasi Pickup" name="pickup_location" value={formData.pickup_location} onChange={handleChange} required />
              <Input label="Jadwal Pickup" type="datetime-local" name="pickup_date" value={formData.pickup_date} onChange={handleChange} required />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Alamat Pickup</label>
                <textarea rows="3" name="pickup_address" value={formData.pickup_address} onChange={handleChange}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">Lokasi Tujuan</h4>
              <Input label="Nama Lokasi Tujuan" name="delivery_location" value={formData.delivery_location} onChange={handleChange} required />
              <div className="flex flex-col">
                <Input label="Target Delivery" type="datetime-local" name="delivery_target_date" value={formData.delivery_target_date} onChange={handleChange} required />
                <p className="text-[10px] text-slate-500 mt-1">Target penyelesaian/pengiriman sesuai komitmen pekerjaan.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Alamat Tujuan</label>
                <textarea rows="3" name="delivery_address" value={formData.delivery_address} onChange={handleChange}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 3 */}
        <Card>
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Informasi Muatan</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input label="Jenis Barang" name="cargo_type" value={formData.cargo_type} onChange={handleChange} />
            <div className="md:col-span-2">
              <Input label="Deskripsi Barang" name="cargo_description" value={formData.cargo_description} onChange={handleChange} />
            </div>
            <Input label="Quantity" type="number" name="cargo_quantity" value={formData.cargo_quantity} onChange={handleChange} />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Unit</label>
              <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                name="cargo_unit" value={formData.cargo_unit} onChange={handleChange}>
                <option value="">Pilih Unit</option>
                <option value="PCS">PCS</option>
                <option value="BOX">BOX</option>
                <option value="PALLET">PALLET</option>
                <option value="CARTON">CARTON</option>
                <option value="KG">KG</option>
                <option value="TON">TON</option>
                <option value="CBM">CBM</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            
            <Input label="Berat (KG)" type="number" name="cargo_weight" value={formData.cargo_weight} onChange={handleChange} />
            <Input label="Volume (CBM)" type="number" name="cargo_volume" value={formData.cargo_volume} onChange={handleChange} />
          </div>
        </Card>

        {/* SECTION 4 */}
        <Card>
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">4. Kebutuhan Transportasi</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Jenis Kendaraan</label>
              <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                name="vehicle_type_requirement" value={formData.vehicle_type_requirement} onChange={handleChange}>
                <option value="">Pilih Jenis</option>
                <option value="Pickup">Pickup</option>
                <option value="Blind Van">Blind Van</option>
                <option value="CDE">CDE</option>
                <option value="CDD">CDD</option>
                <option value="CDD Long">CDD Long</option>
                <option value="Fuso">Fuso</option>
                <option value="Tronton">Tronton</option>
                <option value="Trailer">Trailer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input label="Jumlah Kendaraan" type="number" name="vehicle_quantity" value={formData.vehicle_quantity} onChange={handleChange} />
          </div>
        </Card>

        {/* SECTION 5: DYNAMIC DETAIL EXPORT */}
        {formData.job_order_type === 'EXPORT' && (
          <Card>
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">5. Detail Export</h3>
            </div>
            <div className="p-6 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-2">Dokumen Export</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">Jenis Dokumen Pabean</label>
                    <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      name="customs_document_type" value={formData.export_details.customs_document_type || ''} onChange={handleExportDetailChange}>
                      <option value="">Pilih Dokumen</option>
                      <option value="PEB_BC_3_0">PEB BC 3.0</option>
                      <option value="PEB_BC_3_1">PEB BC 3.1</option>
                      <option value="PEB_BC_3_3">PEB BC 3.3</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  {formData.export_details.customs_document_type === 'OTHER' && (
                    <div className="md:col-span-2">
                      <Input label="Jenis Dokumen Lainnya" name="customs_document_other" value={formData.export_details.customs_document_other || ''} onChange={handleExportDetailChange} />
                    </div>
                  )}

                  <Input label="Nomor Aju" name="aju_number" value={formData.export_details.aju_number || ''} onChange={handleExportDetailChange} />
                  <Input label="Nomor Invoice" name="invoice_number" value={formData.export_details.invoice_number || ''} onChange={handleExportDetailChange} />
                  <Input label="Shipper" name="shipper" value={formData.export_details.shipper || ''} onChange={handleExportDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">Shipping Document</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="No. B/L" name="bl_number" value={formData.export_details.bl_number || ''} onChange={handleExportDetailChange} />
                  <Input label="Tanggal B/L" type="date" name="bl_date" value={formData.export_details.bl_date ? formData.export_details.bl_date.substring(0, 10) : ''} onChange={handleExportDetailChange} />
                  
                  <Input label="No. HBL" name="hbl_number" value={formData.export_details.hbl_number || ''} onChange={handleExportDetailChange} />
                  <Input label="Tanggal HBL" type="date" name="hbl_date" value={formData.export_details.hbl_date ? formData.export_details.hbl_date.substring(0, 10) : ''} onChange={handleExportDetailChange} />
                  
                  <Input label="No. SI" name="si_do_number" value={formData.export_details.si_do_number || ''} onChange={handleExportDetailChange} />
                  <Input label="Tanggal SI" type="date" name="si_do_date" value={formData.export_details.si_do_date ? formData.export_details.si_do_date.substring(0, 10) : ''} onChange={handleExportDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">Shipping Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="ETD" type="date" name="etd_date" value={formData.export_details.etd_date ? formData.export_details.etd_date.substring(0, 10) : ''} onChange={handleExportDetailChange} />
                  <div className="flex flex-col">
                    <Input label="Rencana Delivery" type="date" name="planned_delivery_date" value={formData.export_details.planned_delivery_date ? formData.export_details.planned_delivery_date.substring(0, 10) : ''} onChange={handleExportDetailChange} />
                    <p className="text-[10px] text-slate-500 mt-1">Rencana delivery operasional untuk shipment Export.</p>
                  </div>
                  <Input label="Vessel" name="vessel" value={formData.export_details.vessel || ''} onChange={handleExportDetailChange} />
                  <Input label="Warehouse" name="warehouse" value={formData.export_details.warehouse || ''} onChange={handleExportDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">Cargo / Container</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">Party / Volume</label>
                    <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      name="party_volume_type" value={formData.export_details.party_volume_type || ''} onChange={handleExportDetailChange}>
                      <option value="">Pilih Type</option>
                      <option value="FCL">FCL</option>
                      <option value="LCL/BB">LCL/BB</option>
                    </select>
                  </div>
                </div>

                {formData.export_details.party_volume_type === 'FCL' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <Input label="20 Feet" type="number" name="container_20_qty" value={formData.export_details.container_20_qty || ''} onChange={handleExportDetailChange} min="0" />
                    <Input label="40 Feet" type="number" name="container_40_qty" value={formData.export_details.container_40_qty || ''} onChange={handleExportDetailChange} min="0" />
                    <Input label="45 Feet" type="number" name="container_45_qty" value={formData.export_details.container_45_qty || ''} onChange={handleExportDetailChange} min="0" />
                    <Input label="OT" type="number" name="container_ot_qty" value={formData.export_details.container_ot_qty || ''} onChange={handleExportDetailChange} min="0" />
                    <Input label="FR" type="number" name="container_fr_qty" value={formData.export_details.container_fr_qty || ''} onChange={handleExportDetailChange} min="0" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* SECTION 5: DYNAMIC DETAIL IMPORT */}
        {formData.job_order_type === 'IMPORT' && (
          <Card>
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">5. Detail Import</h3>
            </div>
            <div className="p-6 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-2">Dokumen Import</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">Jenis Dokumen Pabean</label>
                    <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      name="customs_document_type" value={formData.import_details.customs_document_type || ''} onChange={handleImportDetailChange}>
                      <option value="">Pilih Dokumen</option>
                      <option value="PIB_BC_1_6">PIB BC 1.6</option>
                      <option value="PIB_BC_2_0">PIB BC 2.0</option>
                      <option value="PIB_BC_2_8">PIB BC 2.8</option>
                      <option value="PIB_BC_2_3">PIB BC 2.3</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  {formData.import_details.customs_document_type === 'OTHER' && (
                    <div className="md:col-span-2">
                      <Input label="Jenis Dokumen Lainnya" name="customs_document_other" value={formData.import_details.customs_document_other || ''} onChange={handleImportDetailChange} />
                    </div>
                  )}

                  <Input label="Nomor Aju" name="aju_number" value={formData.import_details.aju_number || ''} onChange={handleImportDetailChange} />
                  <Input label="Nomor Invoice" name="invoice_number" value={formData.import_details.invoice_number || ''} onChange={handleImportDetailChange} />
                  <Input label="Shipper" name="shipper" value={formData.import_details.shipper || ''} onChange={handleImportDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">Shipping Document</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="No. B/L" name="bl_number" value={formData.import_details.bl_number || ''} onChange={handleImportDetailChange} />
                  <Input label="Tanggal B/L" type="date" name="bl_date" value={formData.import_details.bl_date ? formData.import_details.bl_date.substring(0, 10) : ''} onChange={handleImportDetailChange} />
                  
                  <Input label="No. HBL" name="hbl_number" value={formData.import_details.hbl_number || ''} onChange={handleImportDetailChange} />
                  <Input label="Tanggal HBL" type="date" name="hbl_date" value={formData.import_details.hbl_date ? formData.import_details.hbl_date.substring(0, 10) : ''} onChange={handleImportDetailChange} />
                  
                  <Input label="No. DO" name="do_number" value={formData.import_details.do_number || ''} onChange={handleImportDetailChange} />
                  <Input label="Tanggal DO" type="date" name="do_date" value={formData.import_details.do_date ? formData.import_details.do_date.substring(0, 10) : ''} onChange={handleImportDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">Shipping Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="ETA" type="date" name="eta_date" value={formData.import_details.eta_date ? formData.import_details.eta_date.substring(0, 10) : ''} onChange={handleImportDetailChange} />
                  <div className="flex flex-col">
                    <Input label="Rencana Delivery" type="date" name="planned_delivery_date" value={formData.import_details.planned_delivery_date ? formData.import_details.planned_delivery_date.substring(0, 10) : ''} onChange={handleImportDetailChange} />
                    <p className="text-[10px] text-slate-500 mt-1">Rencana delivery operasional untuk shipment Import.</p>
                  </div>
                  <Input label="Vessel" name="vessel" value={formData.import_details.vessel || ''} onChange={handleImportDetailChange} />
                  <Input label="Warehouse" name="warehouse" value={formData.import_details.warehouse || ''} onChange={handleImportDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">Cargo / Container</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">Party / Volume</label>
                    <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      name="party_volume_type" value={formData.import_details.party_volume_type || ''} onChange={handleImportDetailChange}>
                      <option value="">Pilih Type</option>
                      <option value="FCL">FCL</option>
                      <option value="LCL/BB">LCL/BB</option>
                    </select>
                  </div>
                </div>

                {formData.import_details.party_volume_type === 'FCL' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <Input label="20 Feet" type="number" name="container_20_qty" value={formData.import_details.container_20_qty || ''} onChange={handleImportDetailChange} min="0" />
                    <Input label="40 Feet" type="number" name="container_40_qty" value={formData.import_details.container_40_qty || ''} onChange={handleImportDetailChange} min="0" />
                    <Input label="45 Feet" type="number" name="container_45_qty" value={formData.import_details.container_45_qty || ''} onChange={handleImportDetailChange} min="0" />
                    <Input label="OT" type="number" name="container_ot_qty" value={formData.import_details.container_ot_qty || ''} onChange={handleImportDetailChange} min="0" />
                    <Input label="FR" type="number" name="container_fr_qty" value={formData.import_details.container_fr_qty || ''} onChange={handleImportDetailChange} min="0" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* SECTION 5: DYNAMIC DETAIL TRUCKING */}
        {formData.job_order_type === 'TRUCKING' && (
          <Card>
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">5. Detail Trucking</h3>
            </div>
            <div className="p-6 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">Shipping Reference</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="No. B/L" name="bl_number" value={formData.trucking_details.bl_number || ''} onChange={handleTruckingDetailChange} />
                  <Input label="Tanggal B/L" type="date" name="bl_date" value={formData.trucking_details.bl_date ? formData.trucking_details.bl_date.substring(0, 10) : ''} onChange={handleTruckingDetailChange} />
                  
                  <Input label="No. SI / DO" name="si_do_number" value={formData.trucking_details.si_do_number || ''} onChange={handleTruckingDetailChange} />
                  <Input label="Tanggal SI / DO" type="date" name="si_do_date" value={formData.trucking_details.si_do_date ? formData.trucking_details.si_do_date.substring(0, 10) : ''} onChange={handleTruckingDetailChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">Shipping Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Vessel / Voyage" name="vessel" value={formData.trucking_details.vessel || ''} onChange={handleTruckingDetailChange} />
                  <div className="flex flex-col">
                    <Input label="Rencana Delivery" type="date" name="planned_delivery_date" value={formData.trucking_details.planned_delivery_date ? formData.trucking_details.planned_delivery_date.substring(0, 10) : ''} onChange={handleTruckingDetailChange} />
                    <p className="text-[10px] text-slate-500 mt-1">Rencana delivery berdasarkan informasi shipment/trucking.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">Cargo / Container</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">Party / Volume</label>
                    <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      name="party_volume_type" value={formData.trucking_details.party_volume_type || ''} onChange={handleTruckingDetailChange}>
                      <option value="">Pilih Type</option>
                      <option value="FCL">FCL</option>
                      <option value="LCL/BB">LCL / BB</option>
                    </select>
                  </div>
                </div>

                {formData.trucking_details.party_volume_type === 'FCL' && (
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold text-slate-200">Container Detail</h5>
                      <Button variant="outline" size="sm" onClick={addTruckingContainer} type="button">
                        + Tambah Container Type
                      </Button>
                    </div>
                    
                    {formData.trucking_details.containers?.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-4">Belum ada container yang ditambahkan.</p>
                    )}

                    <div className="space-y-3">
                      {formData.trucking_details.containers?.map((container, idx) => (
                        <div key={idx} className="flex items-end gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-400">Container Type</label>
                            <select 
                              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-sky-500"
                              value={container.type} 
                              onChange={(e) => handleTruckingContainerChange(idx, 'type', e.target.value)}
                            >
                              <option value="">Pilih Tipe</option>
                              <option value="20STD">20' Standard</option>
                              <option value="40STD">40' Standard</option>
                              <option value="40HC">40' High Cube</option>
                              <option value="45HC">45' High Cube</option>
                              <option value="OT">Open Top</option>
                              <option value="FR">Flat Rack</option>
                            </select>
                          </div>
                          
                          <div className="w-24">
                            <Input label="Quantity" type="number" min="1" value={container.quantity} onChange={(e) => handleTruckingContainerChange(idx, 'quantity', e.target.value)} />
                          </div>
                          
                          <button type="button" onClick={() => removeTruckingContainer(idx)} className="p-2 mb-0.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.trucking_details.party_volume_type === 'LCL/BB' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <Input label="Weight / Ton" type="number" min="0" step="0.01" name="weight" value={formData.trucking_details.weight || ''} onChange={handleTruckingDetailChange} />
                    <Input label="Volume (M³ / CBM)" type="number" min="0" step="0.01" name="volume" value={formData.trucking_details.volume || ''} onChange={handleTruckingDetailChange} />
                    <Input label="Quantity" type="number" min="0" name="quantity" value={formData.trucking_details.quantity || ''} onChange={handleTruckingDetailChange} />
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-300">Unit</label>
                      <select className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        name="unit" value={formData.trucking_details.unit || ''} onChange={handleTruckingDetailChange}>
                        <option value="">Pilih Unit</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                        <option value="PALLET">PALLET</option>
                        <option value="CARTON">CARTON</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {['PROJECT'].includes(formData.job_order_type) && (
          <Card>
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">5. Detail {formData.job_order_type}</h3>
            </div>
            <div className="p-8 text-center text-slate-400">
              <p>Detail khusus {formData.job_order_type} akan ditambahkan pada pengembangan berikutnya.</p>
            </div>
          </Card>
        )}

        {/* SECTION 6 */}
        <Card>
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">6. Informasi Tambahan</h3>
          </div>
          <div className="p-6 grid grid-cols-1 gap-5">
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Special Instruction</label>
                <textarea rows="2" name="special_instruction" value={formData.special_instruction} onChange={handleChange}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Internal Notes</label>
                <textarea rows="2" name="internal_notes" value={formData.internal_notes} onChange={handleChange}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
              </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={() => navigate('/job-orders')}>
          Batal
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleSave('DRAFT')} 
          isLoading={isSubmitting}
        >
          <Save className="w-4 h-4" />
          Simpan Draft
        </Button>
        <Button 
          variant="primary" 
          onClick={() => handleSave('CONFIRMED')} 
          isLoading={isSubmitting}
        >
          <FileCheck className="w-4 h-4" />
          {isEdit ? 'Konfirmasi Job' : 'Buat Job'}
        </Button>
      </div>
    </div>
  );
}
