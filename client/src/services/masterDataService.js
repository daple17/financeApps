import api from './api';

const BASE_URL = '/master-data/business-partners';
const LOCATIONS_URL = '/master-data/locations';
const LOGISTICS_URL = '/master-data/logistics';

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
  },

  // ------------------------------------------------------------------
  // Countries
  // ------------------------------------------------------------------
  getAllCountries: async (params = {}) => {
    try {
      const response = await api.get(`${LOCATIONS_URL}/countries`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },
  getCountryById: async (id) => {
    try {
      const response = await api.get(`${LOCATIONS_URL}/countries/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching country ${id}:`, error);
      throw error;
    }
  },
  createCountry: async (data) => {
    try {
      const response = await api.post(`${LOCATIONS_URL}/countries`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating country:', error);
      throw error;
    }
  },
  updateCountry: async (id, data) => {
    try {
      const response = await api.put(`${LOCATIONS_URL}/countries/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating country ${id}:`, error);
      throw error;
    }
  },

  // ------------------------------------------------------------------
  // Ports
  // ------------------------------------------------------------------
  getAllPorts: async (params = {}) => {
    try {
      const response = await api.get(`${LOCATIONS_URL}/ports`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching ports:', error);
      throw error;
    }
  },
  getPortById: async (id) => {
    try {
      const response = await api.get(`${LOCATIONS_URL}/ports/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching port ${id}:`, error);
      throw error;
    }
  },
  createPort: async (data) => {
    try {
      const response = await api.post(`${LOCATIONS_URL}/ports`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating port:', error);
      throw error;
    }
  },
  updatePort: async (id, data) => {
    try {
      const response = await api.put(`${LOCATIONS_URL}/ports/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating port ${id}:`, error);
      throw error;
    }
  },

  // ------------------------------------------------------------------
  // Warehouses
  // ------------------------------------------------------------------
  getAllWarehouses: async (params = {}) => {
    try {
      const response = await api.get(`${LOCATIONS_URL}/warehouses`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw error;
    }
  },
  getWarehouseById: async (id) => {
    try {
      const response = await api.get(`${LOCATIONS_URL}/warehouses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching warehouse ${id}:`, error);
      throw error;
    }
  },
  createWarehouse: async (data) => {
    try {
      const response = await api.post(`${LOCATIONS_URL}/warehouses`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  },
  updateWarehouse: async (id, data) => {
    try {
      const response = await api.put(`${LOCATIONS_URL}/warehouses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating warehouse ${id}:`, error);
      throw error;
    }
  },

  // ------------------------------------------------------------------
  // Logistics References
  // ------------------------------------------------------------------
  
  // Vehicle Types
  getVehicleTypes: async (params = {}) => {
    const response = await api.get(`${LOGISTICS_URL}/vehicle-types`, { params });
    return response.data;
  },
  getVehicleTypeById: async (id) => {
    const response = await api.get(`${LOGISTICS_URL}/vehicle-types/${id}`);
    return response.data;
  },
  createVehicleType: async (data) => {
    const response = await api.post(`${LOGISTICS_URL}/vehicle-types`, data);
    return response.data;
  },
  updateVehicleType: async (id, data) => {
    const response = await api.put(`${LOGISTICS_URL}/vehicle-types/${id}`, data);
    return response.data;
  },

  // Container Types
  getContainerTypes: async (params = {}) => {
    const response = await api.get(`${LOGISTICS_URL}/container-types`, { params });
    return response.data;
  },
  getContainerTypeById: async (id) => {
    const response = await api.get(`${LOGISTICS_URL}/container-types/${id}`);
    return response.data;
  },
  createContainerType: async (data) => {
    const response = await api.post(`${LOGISTICS_URL}/container-types`, data);
    return response.data;
  },
  updateContainerType: async (id, data) => {
    const response = await api.put(`${LOGISTICS_URL}/container-types/${id}`, data);
    return response.data;
  },

  // Cargo Units
  getCargoUnits: async (params = {}) => {
    const response = await api.get(`${LOGISTICS_URL}/cargo-units`, { params });
    return response.data;
  },
  getCargoUnitById: async (id) => {
    const response = await api.get(`${LOGISTICS_URL}/cargo-units/${id}`);
    return response.data;
  },
  createCargoUnit: async (data) => {
    const response = await api.post(`${LOGISTICS_URL}/cargo-units`, data);
    return response.data;
  },
  updateCargoUnit: async (id, data) => {
    const response = await api.put(`${LOGISTICS_URL}/cargo-units/${id}`, data);
    return response.data;
  },

  // Service Types
  getServiceTypes: async (params = {}) => {
    const response = await api.get(`${LOGISTICS_URL}/service-types`, { params });
    return response.data;
  },
  getServiceTypeById: async (id) => {
    const response = await api.get(`${LOGISTICS_URL}/service-types/${id}`);
    return response.data;
  },
  createServiceType: async (data) => {
    const response = await api.post(`${LOGISTICS_URL}/service-types`, data);
    return response.data;
  },
  updateServiceType: async (id, data) => {
    const response = await api.put(`${LOGISTICS_URL}/service-types/${id}`, data);
    return response.data;
  }
};
