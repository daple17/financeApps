import api from './api';

const operationService = {
  getAll: async (params) => {
    const response = await api.get('/operations', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/operations/${id}`);
    return response.data;
  },

  getByJobOrderId: async (jobOrderId) => {
    const response = await api.get(`/job-orders/${jobOrderId}/operations`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/operations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/operations/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, status, notes) => {
    const response = await api.put(`/operations/${id}/status`, { status, notes });
    return response.data;
  },

  getEvents: async (id) => {
    const response = await api.get(`/operations/${id}/events`);
    return response.data;
  }
};

export default operationService;
