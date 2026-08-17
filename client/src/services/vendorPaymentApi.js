import api from './api';

export const vendorPaymentApi = {
  previewPayment: async (data) => {
    const response = await api.post('/vendor-payments/preview', data);
    return response.data;
  },

  createPayment: async (data) => {
    const response = await api.post('/vendor-payments', data);
    return response.data;
  },

  getPayments: async (params) => {
    const response = await api.get('/vendor-payments', { params });
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/vendor-payments/${id}`);
    return response.data;
  }
};
