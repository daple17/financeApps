import api from './api';

const BASE_URL = '/master-data/business-partners';

export const masterDataService = {
  // Get all partners (with optional role, search, status filters)
  getAllBusinessPartners: async (params = {}) => {
    try {
      const response = await api.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching business partners:', error);
      throw error;
    }
  },

  // Get single partner
  getBusinessPartnerById: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching business partner ${id}:`, error);
      throw error;
    }
  },

  // Create new partner
  createBusinessPartner: async (data) => {
    try {
      const response = await api.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('Error creating business partner:', error);
      throw error;
    }
  },

  // Update existing partner
  updateBusinessPartner: async (id, data) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating business partner ${id}:`, error);
      throw error;
    }
  }
};
