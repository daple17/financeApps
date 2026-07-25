import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../../services/masterDataService';
import operationService from '../../../services/operationService';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';

export default function AssignResourceModal({ operation, onClose, onAssigned }) {
  const { showSuccess, showError } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          masterDataService.getDrivers({ availability: 'AVAILABLE', status: 'ACTIVE' }),
          masterDataService.getVehicles({ status: 'AVAILABLE' })
        ]);
        setDrivers(driversRes.data || []);
        setVehicles(vehiclesRes.data || []);
      } catch (err) {
        showError('Gagal memuat data resource');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, [showError]);

  // Check for warnings whenever vehicle changes
  useEffect(() => {
    setWarning('');
    if (!selectedVehicle) return;
    
    const v = vehicles.find(x => x.id === parseInt(selectedVehicle));
    if (!v) return;

    let warns = [];
    
    // Check Cargo Capacity vs Execution Scope / Cargo Quantity
    // We assume operation.execution_quantity or operation.cargo_quantity is the weight
    const requiredWeight = parseFloat(operation.execution_quantity || operation.cargo_quantity || 0);
    if (requiredWeight > 0 && v.capacity_weight && parseFloat(v.capacity_weight) < requiredWeight) {
      warns.push(`Kapasitas berat kendaraan (${v.capacity_weight} kg) lebih kecil dari muatan (${requiredWeight}).`);
    }

    if (warns.length > 0) {
      setWarning(warns.join(' '));
    }
  }, [selectedVehicle, vehicles, operation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver || !selectedVehicle) {
      showError('Pilih driver dan kendaraan terlebih dahulu');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await operationService.assignResource(operation.id, {
        driver_id: parseInt(selectedDriver),
        vehicle_id: parseInt(selectedVehicle)
      });
      showSuccess('Resource berhasil di-assign');
      onAssigned();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal assign resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-800 flex-shrink-0">
          <h3 className="text-lg font-bold text-white">Assign Resource to Operation</h3>
          <p className="text-sm text-slate-400 mt-1">{operation.operation_no}</p>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <form id="assign-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Pilih Driver <span className="text-rose-400">*</span></label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                >
                  <option value="">-- Pilih Driver (Available) --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.driver_name} ({d.driver_code})</option>
                  ))}
                </select>
                {drivers.length === 0 && <p className="text-xs text-rose-400">Tidak ada driver yang tersedia</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Pilih Kendaraan <span className="text-rose-400">*</span></label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                >
                  <option value="">-- Pilih Kendaraan (Available) --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} - {v.vehicle_type_name || v.vehicle_code} 
                      {v.capacity_weight ? ` (${v.capacity_weight} kg)` : ''}
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && <p className="text-xs text-rose-400">Tidak ada kendaraan yang tersedia</p>}
              </div>

              {warning && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex gap-2">
                  <span className="font-bold">Warning:</span>
                  <span>{warning}</span>
                </div>
              )}
              
            </form>
          )}
        </div>
        
        <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20 flex-shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" form="assign-form" isLoading={isSubmitting} disabled={isLoading || drivers.length === 0 || vehicles.length === 0}>
            Assign Resource
          </Button>
        </div>
      </div>
    </div>
  );
}
