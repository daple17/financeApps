import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, AlertCircle } from 'lucide-react';
import settlementService from '../../../services/settlementService';
import { useToast } from '../../../context/ToastContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

export default function SettlementFormPage() {
  const [advances, setAdvances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchEligibleAdvances();
  }, []);

  const fetchEligibleAdvances = async () => {
    setIsLoading(true);
    try {
      const res = await settlementService.getEligibleAdvances();
      if (res.status === 'success') {
        setAdvances(res.data);
      }
    } catch (err) {
      showError('Gagal memuat daftar Cash Advance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (advance) => {
    setSelectedAdvance(advance);
  };

  const handleCreate = async () => {
    if (!selectedAdvance) return;
    
    setIsSubmitting(true);
    try {
      const res = await settlementService.createDraft(selectedAdvance.id);
      if (res.status === 'success') {
        showSuccess('Settlement draft berhasil dibuat');
        navigate(`/settlements/${res.data.id}`);
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        showError('Settlement untuk Cash Advance ini sudah ada. Mengalihkan...');
        setTimeout(() => navigate('/settlements'), 1500);
      } else {
        showError(err.response?.data?.message || 'Gagal membuat Settlement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settlements')}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Create Settlement</h1>
          <p className="text-sm text-gray-400">Pilih Cash Advance untuk di-settle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Select Advance */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">1. Pilih Cash Advance</h2>
          {isLoading ? (
            <Card className="p-6 text-center text-gray-400">Memuat data...</Card>
          ) : advances.length === 0 ? (
            <Card className="p-6 text-center text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Tidak ada Cash Advance yang eligible (Telah Disburse dan belum di-settle)
            </Card>
          ) : (
            <div className="space-y-3">
              {advances.map(adv => (
                <div
                  key={adv.id}
                  onClick={() => handleSelect(adv)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAdvance?.id === adv.id
                      ? 'bg-primary-900/20 border-primary-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-200">{adv.advance_no}</div>
                    <Badge variant={adv.advance_scope === 'OPERATION' ? 'primary' : 'warning'}>
                      {adv.advance_scope}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Penerima: {adv.recipient_name}</div>
                    <div className="font-semibold text-gray-300">{formatCurrency(adv.total_amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Context */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">2. Review & Konfirmasi</h2>
          {selectedAdvance ? (
            <Card>
              <CardHeader className="border-b border-gray-700">
                <h3 className="font-medium text-gray-200">Detail Cash Advance</h3>
              </CardHeader>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Advance No</div>
                    <div className="font-medium text-gray-200">{selectedAdvance.advance_no}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Penerima</div>
                    <div className="font-medium text-gray-200">{selectedAdvance.recipient_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Scope</div>
                    <div className="font-medium text-gray-200">{selectedAdvance.advance_scope}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Disbursed Amount</div>
                    <div className="font-medium text-primary-400">{formatCurrency(selectedAdvance.total_amount)}</div>
                  </div>
                  {selectedAdvance.job_order_number && (
                    <div className="col-span-2">
                      <div className="text-gray-500">Job Order</div>
                      <div className="font-medium text-gray-200">{selectedAdvance.job_order_number}</div>
                    </div>
                  )}
                  {selectedAdvance.operation_no && (
                    <div className="col-span-2">
                      <div className="text-gray-500">Operation</div>
                      <div className="font-medium text-gray-200">{selectedAdvance.operation_no}</div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="text-gray-500">Purpose</div>
                    <div className="text-gray-200">{selectedAdvance.purpose}</div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-700">
                  <Button 
                    className="w-full" 
                    onClick={handleCreate} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Memproses...' : 'Create Settlement'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-gray-500 border-dashed">
              Pilih Cash Advance di sebelah kiri
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
