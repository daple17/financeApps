import api from './api';

const operationCostService = {
  getByOperationId: async (operationId) => {
    const response = await api.get(`/operations/${operationId}/costs`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/operation-costs/${id}`);
    return response.data;
  },

  create: async (operationId, data) => {
    const response = await api.post(`/operations/${operationId}/costs`, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/operation-costs/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/operation-costs/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.post(`/operation-costs/${id}/status`, { status });
    return response.data;
  },
  
  getCostSummary: async (jobOrderId) => {
    const response = await api.get(`/job-orders/${jobOrderId}/cost-summary`);
    return response.data;
  }
};

export default operationCostService;
