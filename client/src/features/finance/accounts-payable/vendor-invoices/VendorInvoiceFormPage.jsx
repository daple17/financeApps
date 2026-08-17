import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, ArrowLeft, ArrowRight, Receipt } from 'lucide-react';
import { 
  getVendorInvoiceById,
  createDraft,
  updateDraft,
  submitInvoice,
  getEligibleCosts,
  addItem,
  removeItem
} from '../../../../services/vendorInvoiceService';
import { getBusinessPartners } from '../../../../services/masterDataService';
import { useToast } from '../../../../context/ToastContext';
import { Card, CardHeader } from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';

export default function VendorInvoiceFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  
  const [vendors, setVendors] = useState([]);
  const [eligibleCosts, setEligibleCosts] = useState([]);

  // Form State
  const [vendorId, setVendorId] = useState('');
  const [invoiceInfo, setInvoiceInfo] = useState({
    vendor_invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: ''
  });
  const [selectedCosts, setSelectedCosts] = useState([]); // array of operation_cost_id
  const [initialSelectedCosts, setInitialSelectedCosts] = useState([]); // for tracking edits

  useEffect(() => {
    fetchVendors();
    if (isEditMode) {
      loadDraft();
    }
  }, [id]);

  useEffect(() => {
    if (vendorId) {
      fetchEligibleCosts(vendorId);
    }
  }, [vendorId]);

  const fetchVendors = async () => {
    try {
      const res = await getBusinessPartners({ role: 'VENDOR' });
      if (res.status === 'success') {
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    }
  };

  const fetchEligibleCosts = async (vId) => {
    try {
      const res = await getEligibleCosts(vId);
      if (res.status === 'success') {
        setEligibleCosts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch eligible costs', err);
    }
  };

  const loadDraft = async () => {
    setIsLoading(true);
    try {
      const res = await getVendorInvoiceById(id);
      if (res.status === 'success') {
        const data = res.data;
        if (data.status !== 'DRAFT') {
          showError('Hanya Vendor Invoice DRAFT yang dapat diedit');
          navigate('/vendor-invoices');
          return;
        }
        
        setVendorId(data.vendor_id);
        setInvoiceInfo({
          vendor_invoice_number: data.vendor_invoice_number || '',
          invoice_date: data.invoice_date ? data.invoice_date.split('T')[0] : '',
          due_date: data.due_date ? data.due_date.split('T')[0] : '',
          notes: data.notes || ''
        });
        
        const attachedCostIds = data.items ? data.items.map(item => item.operation_cost_id) : [];
        setSelectedCosts(attachedCostIds);
        setInitialSelectedCosts(attachedCostIds);
        
        // Wait for eligible costs to load so we can combine them, but fetchEligibleCosts will trigger via useEffect.
        // Wait, the eligible costs API only returns UNATTACHED costs.
        // We need to inject the ALREADY ATTACHED costs into the eligibleCosts list so they can be deselected.
        // The backend `getById` returns the attached items with their full cost details.
        // We will prepend them to eligibleCosts in the useEffect.
      }
    } catch (err) {
      showError('Gagal memuat data Vendor Invoice');
      navigate('/vendor-invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !vendorId) {
      return showError('Pilih vendor terlebih dahulu');
    }
    if (step === 2) {
      if (!invoiceInfo.vendor_invoice_number.trim()) return showError('Nomor Invoice wajib diisi');
      if (!invoiceInfo.invoice_date) return showError('Tanggal Invoice wajib diisi');
      if (!invoiceInfo.due_date) return showError('Tanggal Jatuh Tempo wajib diisi');
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleCostToggle = (costId) => {
    setSelectedCosts(prev => {
      if (prev.includes(costId)) {
        return prev.filter(id => id !== costId);
      } else {
        return [...prev, costId];
      }
    });
  };

  const getFullCostsList = () => {
    // Combine fetched eligible costs with any initially selected costs that might not be in eligible list anymore
    return eligibleCosts;
  };

  const saveInvoice = async (submit = false) => {
    if (submit && selectedCosts.length === 0) {
      return showError('Minimal satu Operation Cost harus dipilih sebelum Submit');
    }

    setIsSaving(true);
    try {
      let invoiceId = id;
      
      const payload = {
        vendor_id: vendorId,
        ...invoiceInfo
      };

      if (isEditMode) {
        await updateDraft(invoiceId, payload);
      } else {
        const res = await createDraft(payload);
        invoiceId = res.data.id;
      }

      // Handle items (add/remove)
      const toAdd = selectedCosts.filter(c => !initialSelectedCosts.includes(c));
      const toRemove = initialSelectedCosts.filter(c => !selectedCosts.includes(c));

      // Fetch current items to get item_ids for removal
      let currentItems = [];
      if (isEditMode) {
         const getRes = await getVendorInvoiceById(invoiceId);
         currentItems = getRes.data.items || [];
      }

      for (const costId of toRemove) {
        const item = currentItems.find(i => i.operation_cost_id === costId);
        if (item) {
          await removeItem(invoiceId, item.id);
        }
      }

      for (const costId of toAdd) {
        await addItem(invoiceId, costId);
      }

      if (submit) {
        await submitInvoice(invoiceId);
        showSuccess('Vendor Invoice berhasil disubmit');
      } else {
        showSuccess('Vendor Invoice Draft berhasil disimpan');
      }
      
      navigate('/vendor-invoices');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        showError(err.response.data.message || 'Data konflik (Duplikat)');
      } else {
        showError('Terjadi kesalahan saat menyimpan data');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSubtotal = () => {
    return selectedCosts.reduce((total, costId) => {
      const cost = eligibleCosts.find(c => c.id === costId);
      return total + (cost ? parseFloat(cost.amount) : 0);
    }, 0);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Memuat data...</div>;
  }

  const subtotal = calculateSubtotal();
  const selectedVendor = vendors.find(v => v.id == vendorId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/vendor-invoices')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-sky-400" />
              {isEditMode ? 'Edit Vendor Invoice' : 'Buat Vendor Invoice'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Langkah {step} dari 4</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-sky-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      <Card>
        <CardHeader title={
          step === 1 ? "1. Pilih Vendor" :
          step === 2 ? "2. Informasi Invoice" :
          step === 3 ? "3. Pilih Operation Costs" :
          "4. Review & Submit"
        } />
        
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Vendor <span className="text-red-500">*</span></label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  disabled={isEditMode}
                  className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 disabled:opacity-50"
                >
                  <option value="">-- Pilih Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.partner_name}</option>
                  ))}
                </select>
                {isEditMode && <p className="text-xs text-slate-500 mt-2">Vendor tidak dapat diubah setelah draft dibuat.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nomor Invoice Vendor <span className="text-red-500">*</span></label>
                <Input
                  value={invoiceInfo.vendor_invoice_number}
                  onChange={(e) => setInvoiceInfo(prev => ({ ...prev, vendor_invoice_number: e.target.value }))}
                  placeholder="Misal: INV/2026/001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Invoice <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={invoiceInfo.invoice_date}
                  onChange={(e) => setInvoiceInfo(prev => ({ ...prev, invoice_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Jatuh Tempo <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={invoiceInfo.due_date}
                  onChange={(e) => setInvoiceInfo(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Catatan</label>
                <textarea
                  value={invoiceInfo.notes}
                  onChange={(e) => setInvoiceInfo(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 min-h-[100px]"
                  placeholder="Opsional..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {eligibleCosts.length === 0 ? (
                <div className="p-8 text-center border border-slate-700 rounded-xl bg-slate-800/30">
                  <Receipt className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-300">Tidak ada eligible operation costs ditemukan.</h3>
                  <p className="text-slate-500 text-sm mt-1">Vendor ini tidak memiliki operational costs dengan status APPROVED yang siap ditagihkan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-700 rounded-xl">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">
                          {/* Optional Select All */}
                        </th>
                        <th className="px-4 py-3 font-medium">Operation No</th>
                        <th className="px-4 py-3 font-medium">Job Order No</th>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Cost Type</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleCosts.map(cost => (
                        <tr key={cost.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCosts.includes(cost.id)}
                              onChange={() => handleCostToggle(cost.id)}
                              className="w-4 h-4 text-sky-500 bg-slate-900 border-slate-700 rounded focus:ring-sky-500 focus:ring-2"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-sky-400">{cost.operation_no}</td>
                          <td className="px-4 py-3">{cost.job_order_number || '-'}</td>
                          <td className="px-4 py-3">{cost.customer_name || '-'}</td>
                          <td className="px-4 py-3">{cost.cost_type}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate" title={cost.description}>{cost.description}</td>
                          <td className="px-4 py-3">{cost.transaction_date ? new Date(cost.transaction_date).toLocaleDateString('id-ID') : '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-white">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(cost.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">Informasi Vendor & Invoice</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Vendor:</span>
                    <span className="text-white font-medium">{selectedVendor?.partner_name}</span>
                    
                    <span className="text-slate-500">No. Invoice:</span>
                    <span className="text-white font-medium">{invoiceInfo.vendor_invoice_number}</span>
                    
                    <span className="text-slate-500">Tgl Invoice:</span>
                    <span className="text-white font-medium">{new Date(invoiceInfo.invoice_date).toLocaleDateString('id-ID')}</span>
                    
                    <span className="text-slate-500">Jatuh Tempo:</span>
                    <span className="text-white font-medium">{new Date(invoiceInfo.due_date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">Financial Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Number of Costs:</span>
                    <span className="text-white font-medium">{selectedCosts.length} Costs</span>
                    
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="text-white font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}</span>
                    
                    <span className="text-slate-500">Tax:</span>
                    <span className="text-white font-medium">Rp 0,00</span>
                    
                    <span className="text-slate-500 font-bold mt-2">Total:</span>
                    <span className="text-emerald-400 font-bold text-lg mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700 flex justify-between bg-slate-800/30">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || isSaving}>
            Sebelumnya
          </Button>
          
          <div className="flex gap-3">
            {step < 4 ? (
              <Button variant="primary" onClick={handleNext}>
                Selanjutnya
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => saveInvoice(false)}
                  disabled={isSaving}
                >
                  <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
                  Save Draft
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => saveInvoice(true)}
                  disabled={isSaving}
                  className="bg-sky-600 hover:bg-sky-500"
                >
                  <Send className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
                  Save & Submit
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
