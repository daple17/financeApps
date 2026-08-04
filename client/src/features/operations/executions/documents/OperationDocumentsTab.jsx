import React, { useState, useEffect } from 'react';
import { Upload, File, FileText, CheckCircle, XCircle, Trash2, Download, Eye, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { useToast } from '../../../../context/ToastContext';
import operationService from '../../../../services/operationService';
import PodSubmissionModal from './PodSubmissionModal';

export default function OperationDocumentsTab({ operationId, operationStatus }) {
  const { showSuccess, showError } = useToast();
  const [documents, setDocuments] = useState([]);
  const [pod, setPod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState('BAST');
  const [uploadFile, setUploadFile] = useState(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');

  // Verification state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState(null);
  const [verifyReason, setVerifyReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [showPodModal, setShowPodModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [operationId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [docRes, podRes] = await Promise.all([
        operationService.getDocuments(operationId),
        operationService.getPod(operationId)
      ]);
      if (docRes.status === 'success') setDocuments(docRes.data);
      if (podRes.status === 'success') setPod(podRes.data);
    } catch (error) {
      showError('Gagal memuat dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showError('Pilih file terlebih dahulu');
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('document_type', uploadType);
    if (documentNumber) formData.append('document_number', documentNumber);
    if (documentDate) formData.append('document_date', documentDate);
    if (documentNotes) formData.append('notes', documentNotes);
    
    try {
      await operationService.uploadDocument(operationId, formData);
      showSuccess('Dokumen berhasil diunggah');
      setUploadFile(null);
      setDocumentNumber('');
      setDocumentDate('');
      setDocumentNotes('');
      setUploadType('BAST');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal mengunggah dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Yakin ingin menghapus dokumen ini?')) return;
    try {
      await operationService.deleteDocument(operationId, docId);
      showSuccess('Dokumen berhasil dihapus');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await operationService.verifyPod(operationId, pod.id, verifyAction, verifyReason);
      showSuccess(`POD berhasil ${verifyAction === 'VERIFY' ? 'diverifikasi' : 'ditolak'}`);
      setShowVerifyModal(false);
      setVerifyReason('');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal memverifikasi POD');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Memuat dokumen...</div>;
  }

  const isCompletedOrCancelled = ['COMPLETED', 'CANCELLED'].includes(operationStatus);
  const isDelivered = operationStatus === 'DELIVERED';

  const formatDateTime = (date, time) => {
    if (!date || !time) return '-';
    return `${new Date(date).toLocaleDateString('id-ID')} ${time}`;
  };

  return (
    <div className="space-y-6">
      {/* POD Section */}
      <Card>
        <CardHeader title="Proof of Delivery (POD)" />
        <div className="p-6">
          {!pod ? (
            <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-200 mb-1">POD Belum Disubmit</h3>
              <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
                {!isDelivered 
                  ? 'POD dapat disubmit setelah Operation berstatus Delivered.' 
                  : 'Selesaikan operasional dengan mensubmit Proof of Delivery.'}
              </p>
              
              <Button 
                variant="primary" 
                disabled={!isDelivered}
                onClick={() => setShowPodModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Submit POD
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">Ringkasan POD</h3>
                    <Badge variant={
                      pod.status === 'VERIFIED' ? 'success' :
                      pod.status === 'REJECTED' ? 'danger' : 'warning'
                    }>{pod.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Disubmit pada: {new Date(pod.submitted_at).toLocaleString('id-ID')} oleh {pod.submitted_by_name || '-'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <a href={`http://localhost:5000${pod.file_path || documents.find(d => d.document_type === 'POD')?.file_path}`} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> Lihat Bukti (Evidence)
                    </Button>
                  </a>
                  
                  {pod.status === 'SUBMITTED' && !isCompletedOrCancelled && (
                    <>
                      <Button variant="success" size="sm" onClick={() => {
                        setVerifyAction('VERIFY');
                        setVerifyReason('');
                        setShowVerifyModal(true);
                      }}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Verifikasi
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => {
                        setVerifyAction('REJECT');
                        setVerifyReason('');
                        setShowVerifyModal(true);
                      }}>
                        <XCircle className="w-4 h-4 mr-2" /> Tolak
                      </Button>
                    </>
                  )}
                  {pod.status === 'REJECTED' && isDelivered && (
                    <Button variant="primary" size="sm" onClick={() => setShowPodModal(true)}>
                      <Upload className="w-4 h-4 mr-2" /> Submit Ulang POD
                    </Button>
                  )}
                </div>
              </div>

              {pod.status === 'REJECTED' && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
                  <span className="font-semibold">Alasan Penolakan:</span> {pod.rejection_reason}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Penerima</div>
                  <div className="text-sm text-slate-200 font-medium">{pod.recipient_name || '-'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{pod.recipient_company || '-'}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Kontak</div>
                  <div className="text-sm text-slate-200">{pod.recipient_phone || '-'}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Waktu Diterima</div>
                  <div className="text-sm text-slate-200">{formatDateTime(pod.delivery_date, pod.delivery_time)}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Kondisi</div>
                  <div className="text-sm text-slate-200">{pod.received_condition || '-'}</div>
                </div>
              </div>
              
              {pod.delivery_notes && (
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Catatan Pengiriman</div>
                  <div className="text-sm text-slate-300">{pod.delivery_notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Dokumen Operasional" />
          <div className="p-1">
            {documents.filter(d => d.document_type !== 'POD').length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Belum ada dokumen operasional.</div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {documents.filter(d => d.document_type !== 'POD').map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{doc.file_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-2 items-center">
                          <Badge variant="outline" className="text-[10px]">{doc.document_type}</Badge>
                          {doc.document_number && <span>No: {doc.document_number}</span>}
                          {doc.document_date && <span>Tgl: {new Date(doc.document_date).toLocaleDateString('id-ID')}</span>}
                          <span>• {new Date(doc.uploaded_at).toLocaleString('id-ID')}</span>
                        </div>
                        {doc.notes && <div className="text-xs text-slate-500 mt-1 italic">{doc.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`http://localhost:5000${doc.file_path}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                      {!isCompletedOrCancelled && (
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Upload Form */}
        {!isCompletedOrCancelled && (
          <Card>
            <CardHeader title="Unggah Dokumen" />
            <div className="p-5">
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Jenis Dokumen <span className="text-rose-500">*</span></label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    required
                  >
                    <option value="BAST">Berita Acara Serah Terima (BAST)</option>
                    <option value="SURAT_JALAN">Surat Jalan Internal</option>
                    <option value="TIMBANGAN">Tiket Timbangan</option>
                    <option value="CUSTOMS">Dokumen Bea Cukai</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nomor Dokumen</label>
                  <input 
                    type="text" 
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="(Opsional)"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Dokumen</label>
                  <input 
                    type="date" 
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pilih File <span className="text-rose-500">*</span></label>
                  <input 
                    type="file" 
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    className="block w-full text-sm text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-sky-500/10 file:text-sky-400
                      hover:file:bg-sky-500/20 transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Catatan</label>
                  <textarea 
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    rows="2"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="(Opsional)"
                  />
                </div>

                <Button type="submit" className="w-full" isLoading={isUploading}>
                  <Upload className="w-4 h-4 mr-2" /> Unggah Dokumen
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>

      {/* Submit POD Modal */}
      {showPodModal && (
        <PodSubmissionModal 
          operationId={operationId} 
          onClose={() => setShowPodModal(false)}
          onSuccess={() => {
            setShowPodModal(false);
            fetchData();
          }}
        />
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {verifyAction === 'VERIFY' ? 'Verifikasi POD' : 'Tolak POD'}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300">
                {verifyAction === 'VERIFY' 
                  ? 'Anda yakin ingin memverifikasi dokumen POD ini sebagai sah?' 
                  : 'POD yang ditolak akan meminta operasional mengunggah ulang dokumen.'}
              </p>
              
              {verifyAction === 'REJECT' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Alasan Penolakan <span className="text-rose-500">*</span></label>
                  <textarea 
                    className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    rows="3"
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    placeholder="Dokumen buram, dll..."
                  />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20">
              <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>Batal</Button>
              <Button 
                variant={verifyAction === 'VERIFY' ? 'success' : 'danger'} 
                onClick={handleVerify} 
                isLoading={isVerifying}
                disabled={verifyAction === 'REJECT' && !verifyReason}
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
