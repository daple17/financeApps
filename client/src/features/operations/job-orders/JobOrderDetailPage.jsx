import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { Plus, Truck } from 'lucide-react';

export default function JobOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const { hasPermission } = useAuth();
  
  const [jobOrder, setJobOrder] = useState(null);
  const [operations, setOperations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        const [res, opsRes] = await Promise.all([
          api.get(`/job-orders/${id}`),
          api.get(`/job-orders/${id}/operations`)
        ]);
        
        if (res.data.status === 'success') {
          setJobOrder(res.data.data);
        }
        if (opsRes.data.status === 'success') {
          setOperations(opsRes.data.data);
        }
      } catch (err) {
        showError('Gagal memuat rincian Job Order');
        navigate('/job-orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobOrder();
  }, [id, navigate, showError]);

  if (isLoading) return <div className="p-12 text-center text-slate-400">Memuat rincian...</div>;
  if (!jobOrder) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="default">Draft</Badge>;
      case 'CONFIRMED': return <Badge variant="primary">Confirmed</Badge>;
      case 'ASSIGNED': return <Badge variant="warning">Assigned</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">In Progress</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CLOSED': return <Badge variant="success">Closed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/job-orders')} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              {jobOrder.job_order_number}
              {getStatusBadge(jobOrder.job_status)}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Customer: <span className="font-medium text-slate-200">
                {jobOrder.customer_id ? (
                  <Link to={`/master-data/business-partners/${jobOrder.customer_id}/edit`} className="text-sky-400 hover:underline">
                    {jobOrder.customer_name}
                  </Link>
                ) : (
                  jobOrder.customer_name
                )}
              </span> | 
              Tipe: <span className="font-medium text-slate-200 ml-1">{jobOrder.job_order_type || '-'}</span> | 
              Rute: <span className="font-medium text-slate-200 ml-1">{jobOrder.pickup_location || '?'} → {jobOrder.delivery_location || '?'}</span> | 
              Tgl: <span className="font-medium text-slate-200 ml-1">{new Date(jobOrder.job_date).toLocaleDateString('id-ID')}</span>
            </p>
          </div>
        </div>

        {hasPermission('job_orders.update') && (
          <Button variant="outline" onClick={() => navigate(`/job-orders/${jobOrder.id}/edit`)}>
            <Edit2 className="w-4 h-4" />
            Edit Job Order
          </Button>
        )}
      </div>

      <div className="border-b border-slate-800">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {['OVERVIEW', 'OPERATIONS', 'COST', 'DOCUMENTS', 'ACTIVITY'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Informasi Pekerjaan" />
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">No. JO</span>
                  <span className="text-white font-medium">{jobOrder.job_order_number}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Tgl. Job</span>
                  <span className="text-white font-medium">{new Date(jobOrder.job_date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Customer</span>
                  <span className="text-white font-medium">
                    {jobOrder.customer_id ? (
                      <Link to={`/master-data/business-partners/${jobOrder.customer_id}/edit`} className="text-sky-400 hover:underline flex items-center gap-1">
                        {jobOrder.customer_name}
                      </Link>
                    ) : (
                      jobOrder.customer_name || '-'
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Cust Ref.</span>
                  <span className="text-white font-medium">{jobOrder.customer_reference || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">PIC</span>
                  <span className="text-white font-medium">{jobOrder.customer_pic || '-'} ({jobOrder.customer_phone || '-'})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Layanan</span>
                  <span className="text-white font-medium">{jobOrder.service_type || '-'}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Informasi Rute & Waktu" />
              <div className="p-5 space-y-3 text-sm">
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs font-bold text-sky-400 mb-1">PICKUP</div>
                  <div className="text-white font-medium">{jobOrder.pickup_location || '-'}</div>
                  <div className="text-slate-400 text-xs mt-1">{jobOrder.pickup_address || '-'}</div>
                  <div className="text-slate-300 text-xs mt-1 border-t border-slate-800 pt-1">
                    {jobOrder.pickup_date ? new Date(jobOrder.pickup_date).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 mb-1">DELIVERY</div>
                  <div className="text-white font-medium">{jobOrder.delivery_location || '-'}</div>
                  <div className="text-slate-400 text-xs mt-1">{jobOrder.delivery_address || '-'}</div>
                  <div className="text-slate-300 text-xs mt-1 border-t border-slate-800 pt-1">
                    {jobOrder.delivery_target_date ? new Date(jobOrder.delivery_target_date).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Informasi Muatan & Transportasi" />
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Jenis Barang</span>
                  <span className="text-white font-medium">{jobOrder.cargo_type || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Deskripsi</span>
                  <span className="text-white font-medium">{jobOrder.cargo_description || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Quantity</span>
                  <span className="text-white font-medium">{jobOrder.cargo_quantity || '-'} {jobOrder.cargo_unit || ''}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Berat / Volume</span>
                  <span className="text-white font-medium">
                    {jobOrder.cargo_weight ? `${jobOrder.cargo_weight} KG` : '-'} / {jobOrder.cargo_volume ? `${jobOrder.cargo_volume} CBM` : '-'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Kendaraan</span>
                  <span className="text-white font-medium">{jobOrder.vehicle_quantity || '-'}x {jobOrder.vehicle_type_requirement || '-'}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Audit & Catatan" />
              <div className="p-5 space-y-3 text-sm">
                 <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Dibuat Oleh</span>
                  <span className="text-white font-medium">{jobOrder.created_by_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Dibuat Pada</span>
                  <span className="text-white font-medium">{new Date(jobOrder.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Diperbarui Oleh</span>
                  <span className="text-white font-medium">{jobOrder.updated_by_name || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Diperbarui Pada</span>
                  <span className="text-white font-medium">{new Date(jobOrder.updated_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 mb-1">Spesial Instruksi</div>
                  <div className="text-slate-300 p-2 bg-slate-900/50 rounded-lg border border-slate-800">{jobOrder.special_instruction || '-'}</div>
                </div>
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 mb-1">Internal Notes</div>
                  <div className="text-slate-300 p-2 bg-slate-900/50 rounded-lg border border-slate-800">{jobOrder.internal_notes || '-'}</div>
                </div>
              </div>
            </Card>

            {jobOrder.job_order_type === 'EXPORT' && jobOrder.export_details && (
              <Card className="md:col-span-2">
                <CardHeader title="Detail Export" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-sky-400 uppercase">Dokumen</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Jenis Dok.</span>
                      <span className="text-white">
                        {jobOrder.export_details.customs_document_type === 'OTHER' 
                          ? jobOrder.export_details.customs_document_other || '-' 
                          : jobOrder.export_details.customs_document_type?.replace(/_/g, ' ') || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Aju</span>
                      <span className="text-white">{jobOrder.export_details.aju_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Invoice</span>
                      <span className="text-white">{jobOrder.export_details.invoice_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Shipper</span>
                      <span className="text-white">{jobOrder.export_details.shipper || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase">B/L & HBL</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">B/L</span>
                      <span className="text-white">{jobOrder.export_details.bl_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tgl B/L</span>
                      <span className="text-white">{jobOrder.export_details.bl_date ? new Date(jobOrder.export_details.bl_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">HBL</span>
                      <span className="text-white">{jobOrder.export_details.hbl_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">SI</span>
                      <span className="text-white">{jobOrder.export_details.si_do_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tgl SI</span>
                      <span className="text-white">{jobOrder.export_details.si_do_date ? new Date(jobOrder.export_details.si_do_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase">Shipping Info</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Vessel</span>
                      <span className="text-white">{jobOrder.export_details.vessel || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">ETD</span>
                      <span className="text-white">{jobOrder.export_details.etd_date ? new Date(jobOrder.export_details.etd_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Warehouse</span>
                      <span className="text-white">{jobOrder.export_details.warehouse || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-purple-400 uppercase">Cargo & Container</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Party / Volume</span>
                      <span className="text-white font-medium">{jobOrder.export_details.party_volume_type || '-'}</span>
                    </div>
                    {jobOrder.export_details.party_volume_type === 'FCL' && (
                      <div className="pt-2">
                        <div className="text-slate-400 text-xs mb-1">Container:</div>
                        <ul className="text-white space-y-1 pl-1">
                          {jobOrder.export_details.container_20_qty > 0 && <li>{jobOrder.export_details.container_20_qty} × 20'</li>}
                          {jobOrder.export_details.container_40_qty > 0 && <li>{jobOrder.export_details.container_40_qty} × 40'</li>}
                          {jobOrder.export_details.container_45_qty > 0 && <li>{jobOrder.export_details.container_45_qty} × 45'</li>}
                          {jobOrder.export_details.container_ot_qty > 0 && <li>{jobOrder.export_details.container_ot_qty} × OT</li>}
                          {jobOrder.export_details.container_fr_qty > 0 && <li>{jobOrder.export_details.container_fr_qty} × FR</li>}
                          {!jobOrder.export_details.container_20_qty && !jobOrder.export_details.container_40_qty && !jobOrder.export_details.container_45_qty && !jobOrder.export_details.container_ot_qty && !jobOrder.export_details.container_fr_qty && (
                            <li className="text-slate-500 italic">-</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {jobOrder.job_order_type === 'IMPORT' && jobOrder.import_details && (
              <Card className="md:col-span-2">
                <CardHeader title="Detail Import" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-sky-400 uppercase">Dokumen</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Jenis Dok.</span>
                      <span className="text-white">
                        {jobOrder.import_details.customs_document_type === 'OTHER' 
                          ? jobOrder.import_details.customs_document_other || '-' 
                          : jobOrder.import_details.customs_document_type?.replace(/_/g, ' ') || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Aju</span>
                      <span className="text-white">{jobOrder.import_details.aju_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Invoice</span>
                      <span className="text-white">{jobOrder.import_details.invoice_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Shipper</span>
                      <span className="text-white">{jobOrder.import_details.shipper || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase">B/L & HBL</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">B/L</span>
                      <span className="text-white">{jobOrder.import_details.bl_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tgl B/L</span>
                      <span className="text-white">{jobOrder.import_details.bl_date ? new Date(jobOrder.import_details.bl_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">HBL</span>
                      <span className="text-white">{jobOrder.import_details.hbl_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">DO</span>
                      <span className="text-white">{jobOrder.import_details.do_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tgl DO</span>
                      <span className="text-white">{jobOrder.import_details.do_date ? new Date(jobOrder.import_details.do_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase">Shipping Info</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Vessel</span>
                      <span className="text-white">{jobOrder.import_details.vessel || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">ETA</span>
                      <span className="text-white">{jobOrder.import_details.eta_date ? new Date(jobOrder.import_details.eta_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Warehouse</span>
                      <span className="text-white">{jobOrder.import_details.warehouse || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-purple-400 uppercase">Cargo & Container</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Party / Volume</span>
                      <span className="text-white font-medium">{jobOrder.import_details.party_volume_type || '-'}</span>
                    </div>
                    {jobOrder.import_details.party_volume_type === 'FCL' && (
                      <div className="pt-2">
                        <div className="text-slate-400 text-xs mb-1">Container:</div>
                        <ul className="text-white space-y-1 pl-1">
                          {jobOrder.import_details.container_20_qty > 0 && <li>{jobOrder.import_details.container_20_qty} × 20'</li>}
                          {jobOrder.import_details.container_40_qty > 0 && <li>{jobOrder.import_details.container_40_qty} × 40'</li>}
                          {jobOrder.import_details.container_45_qty > 0 && <li>{jobOrder.import_details.container_45_qty} × 45'</li>}
                          {jobOrder.import_details.container_ot_qty > 0 && <li>{jobOrder.import_details.container_ot_qty} × OT</li>}
                          {jobOrder.import_details.container_fr_qty > 0 && <li>{jobOrder.import_details.container_fr_qty} × FR</li>}
                          {!jobOrder.import_details.container_20_qty && !jobOrder.import_details.container_40_qty && !jobOrder.import_details.container_45_qty && !jobOrder.import_details.container_ot_qty && !jobOrder.import_details.container_fr_qty && (
                            <li className="text-slate-500 italic">-</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {jobOrder.job_order_type === 'TRUCKING' && jobOrder.trucking_details && (
              <Card className="md:col-span-2">
                <CardHeader title="Detail Trucking" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase">Shipping Reference</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">B/L</span>
                      <span className="text-white">{jobOrder.trucking_details.bl_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tgl B/L</span>
                      <span className="text-white">{jobOrder.trucking_details.bl_date ? new Date(jobOrder.trucking_details.bl_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">SI / DO</span>
                      <span className="text-white">{jobOrder.trucking_details.si_do_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tgl SI/DO</span>
                      <span className="text-white">{jobOrder.trucking_details.si_do_date ? new Date(jobOrder.trucking_details.si_do_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase">Shipping Info</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Vessel</span>
                      <span className="text-white">{jobOrder.trucking_details.vessel || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Rencana Delivery</span>
                      <span className="text-white">{jobOrder.trucking_details.planned_delivery_date ? new Date(jobOrder.trucking_details.planned_delivery_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-purple-400 uppercase">Cargo & Container</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Party / Volume</span>
                      <span className="text-white font-medium">{jobOrder.trucking_details.party_volume_type || '-'}</span>
                    </div>
                    
                    {jobOrder.trucking_details.party_volume_type === 'FCL' && (
                      <div className="pt-2">
                        <div className="text-slate-400 text-xs mb-1">Container:</div>
                        <ul className="text-white space-y-1 pl-1">
                          {jobOrder.trucking_details.containers && jobOrder.trucking_details.containers.length > 0 ? (
                            jobOrder.trucking_details.containers.map((c, idx) => (
                              <li key={idx}>{c.quantity} × {
                                c.type === '20STD' ? "20' Standard" :
                                c.type === '40STD' ? "40' Standard" :
                                c.type === '40HC' ? "40' High Cube" :
                                c.type === '45HC' ? "45' High Cube" :
                                c.type === 'OT' ? "Open Top" :
                                c.type === 'FR' ? "Flat Rack" : c.type
                              }</li>
                            ))
                          ) : (
                            <li className="text-slate-500 italic">-</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {jobOrder.trucking_details.party_volume_type === 'LCL/BB' && (
                      <div className="pt-2">
                        <div className="bg-slate-800/30 rounded px-3 py-2 text-xs text-slate-400">
                          Data muatan LCL/BB mengikuti <strong>Informasi Muatan</strong> di panel utama.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {jobOrder.job_order_type === 'PROJECT' && jobOrder.project_details && (
              <Card className="md:col-span-2">
                <CardHeader title="Detail Project" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-sky-400 uppercase">Project Reference</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">No. SI / DO</span>
                      <span className="text-white">{jobOrder.project_details.si_do_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Tanggal SI / DO</span>
                      <span className="text-white">{jobOrder.project_details.si_do_date ? new Date(jobOrder.project_details.si_do_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Rencana Delivery</span>
                      <span className="text-white">{jobOrder.project_details.planned_delivery_date ? new Date(jobOrder.project_details.planned_delivery_date).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase">Project Information</div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Nama Project</span>
                      <span className="text-white">{jobOrder.project_details.project_name || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">Lokasi / Site Project</span>
                      <span className="text-white">{jobOrder.project_details.project_site || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">PIC Site</span>
                      <span className="text-white">{jobOrder.project_details.site_pic_name || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-400">No. Telepon PIC Site</span>
                      <span className="text-white">{jobOrder.project_details.site_pic_phone || '-'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {['COST', 'DOCUMENTS'].includes(activeTab) && (
          <Card>
            <div className="p-12 text-center">
              <h3 className="text-lg font-medium text-white mb-2">Segera Hadir</h3>
              <p className="text-slate-400 text-sm">Fitur {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} akan tersedia pada fase berikutnya.</p>
            </div>
          </Card>
        )}

        {activeTab === 'OPERATIONS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Daftar Operations</h3>
              <Button onClick={() => navigate(`/operations/create?jobOrderId=${id}`)}>
                <Plus className="w-4 h-4 mr-2" /> Create Operation
              </Button>
            </div>

            {operations.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-300">Belum ada Operation</h3>
                <p className="text-xs text-slate-500 mt-1">Buat operation baru untuk memulai eksekusi Job Order ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operations.map((op) => (
                  <Card key={op.id} className="cursor-pointer hover:border-sky-500/50 transition-colors" onClick={() => navigate(`/operations/${op.id}`)}>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sky-400 font-medium text-sm">{op.operation_no}</span>
                          <div className="text-xs text-slate-500 mt-0.5">{op.operation_date ? new Date(op.operation_date).toLocaleDateString('id-ID') : '-'}</div>
                        </div>
                        <Badge variant={
                          op.status === 'COMPLETED' ? 'success' :
                          op.status === 'IN_PROGRESS' ? 'primary' :
                          op.status === 'CANCELLED' ? 'danger' : 'warning'
                        }>
                          {op.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block mb-0.5">PIC</span>
                          <span className="text-slate-300">{op.pic_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Qty Execution</span>
                          <span className="text-slate-300">{op.execution_quantity || 'Full'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ACTIVITY' && (
          <Card>
            <CardHeader title="Activity Log" />
            <div className="p-6">
              <div className="space-y-6">
                {jobOrder.activities && jobOrder.activities.length > 0 ? (
                  jobOrder.activities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4">
                      <div className="absolute left-2 top-8 -bottom-6 w-px bg-slate-800"></div>
                      <div className="relative z-10 w-4 h-4 rounded-full bg-slate-800 border-2 border-sky-500 mt-1 flex-shrink-0"></div>
                      <div>
                        <div className="text-sm font-semibold text-white">{activity.description}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(activity.created_at).toLocaleString('id-ID')} oleh <span className="font-medium text-slate-300">{activity.performed_by_name || 'System'}</span> via {activity.source}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">Belum ada aktivitas terekam.</div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
