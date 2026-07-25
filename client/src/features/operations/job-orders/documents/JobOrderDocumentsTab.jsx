import React, { useState, useEffect } from 'react';
import { File, Download, Search } from 'lucide-react';
import { Card, CardHeader } from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../services/api'; // using api directly since jobOrderService doesn't have getDocuments

export default function JobOrderDocumentsTab({ jobOrderId }) {
  const { showError } = useToast();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [jobOrderId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/job-orders/${jobOrderId}/documents`);
      if (res.data.status === 'success') {
        setDocuments(res.data.data);
      }
    } catch (error) {
      showError('Gagal memuat dokumen Job Order');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Memuat dokumen...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Semua Dokumen Terkait" />
        <div className="p-1">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-300">Belum ada Dokumen</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Dokumen operasional dan POD yang diunggah pada setiap Operation akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <File className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{doc.original_filename}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-2 items-center">
                        <Badge variant="outline" className="text-[10px]">{doc.document_type}</Badge>
                        <span>•</span>
                        <span>Op. No: <span className="font-medium text-slate-300">{doc.operation_no}</span></span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`http://localhost:5000${doc.file_path}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Download/Lihat Dokumen"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
