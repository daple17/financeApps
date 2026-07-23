import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import JobOrderForm from './JobOrderForm';

export default function EditJobOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  
  const [jobOrder, setJobOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        const res = await api.get(`/job-orders/${id}`);
        if (res.data.status === 'success') {
          setJobOrder(res.data.data);
        }
      } catch (err) {
        showError('Gagal memuat Job Order');
        navigate('/job-orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobOrder();
  }, [id, navigate, showError]);

  if (isLoading) return <div className="p-12 text-center text-slate-400">Memuat data...</div>;
  if (!jobOrder) return null;

  return <JobOrderForm initialData={jobOrder} isEdit={true} />;
}
