import api from './api';

export const getVendorInvoiceDashboard = async () => {
  const response = await api.get('vendor-invoices/dashboard');
  return response.data;
};

export const getVendorInvoices = async (params) => {
  const response = await api.get('vendor-invoices', { params });
  return response.data;
};

export const getVendorInvoiceById = async (id) => {
  const response = await api.get(`vendor-invoices/${id}`);
  return response.data;
};

export const getEligibleCosts = async (vendorId) => {
  const response = await api.get('vendor-invoices/eligible-costs', { params: { vendor_id: vendorId } });
  return response.data;
};

export const createDraft = async (data) => {
  const response = await api.post('vendor-invoices', data);
  return response.data;
};

export const updateDraft = async (id, data) => {
  const response = await api.put(`vendor-invoices/${id}`, data);
  return response.data;
};

export const deleteDraft = async (id) => {
  const response = await api.delete(`vendor-invoices/${id}`);
  return response.data;
};

export const addItem = async (id, costId) => {
  const response = await api.post(`vendor-invoices/${id}/items`, { operation_cost_id: costId });
  return response.data;
};

export const removeItem = async (id, itemId) => {
  const response = await api.delete(`vendor-invoices/${id}/items/${itemId}`);
  return response.data;
};

export const submitInvoice = async (id) => {
  const response = await api.post(`vendor-invoices/${id}/submit`);
  return response.data;
};

export const reviseInvoice = async (id) => {
  const response = await api.post(`vendor-invoices/${id}/revise`);
  return response.data;
};

// Phase 5.5: Liability Posting
export const getPostingPreview = async (id) => {
  const response = await api.get(`vendor-invoices/${id}/posting-preview`);
  return response.data;
};

export const postLiability = async (id) => {
  const response = await api.post(`vendor-invoices/${id}/post`);
  return response.data;
};
