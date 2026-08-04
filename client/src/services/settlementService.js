import api from './api';

const settlementService = {
  getAll: async (filters = {}) => {
    const response = await api.get('/settlements', { params: filters });
    return response.data;
  },

  getEligibleAdvances: async () => {
    const response = await api.get('/settlements/eligible-advances');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/settlements/${id}`);
    return response.data;
  },

  createDraft: async (cashAdvanceId) => {
    const response = await api.post('/settlements', { cash_advance_id: cashAdvanceId });
    return response.data;
  },

  updateNotes: async (id, notes) => {
    const response = await api.put(`/settlements/${id}`, { notes });
    return response.data;
  },

  deleteSettlement: async (id) => {
    const response = await api.delete(`/settlements/${id}`);
    return response.data;
  },

  getEligibleCosts: async (id) => {
    const response = await api.get(`/settlements/${id}/eligible-costs`);
    return response.data;
  },

  addItem: async (id, costId) => {
    const response = await api.post(`/settlements/${id}/items`, { operation_cost_id: costId });
    return response.data;
  },

  removeItem: async (id, itemId) => {
    const response = await api.delete(`/settlements/${id}/items/${itemId}`);
    return response.data;
  },

  submitSettlement: async (id) => {
    const response = await api.post(`/settlements/${id}/submit`);
    return response.data;
  },

  reviseSettlement: async (id) => {
    const response = await api.post(`/settlements/${id}/revise`);
    return response.data;
  }
};

export default settlementService;
