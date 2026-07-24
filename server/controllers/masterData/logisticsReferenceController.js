const LogisticsReferenceModel = require('../../models/masterData/logisticsReferenceModel');

const logisticsReferenceController = {
  // --- VEHICLE TYPES ---
  getVehicleTypes: async (req, res) => {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status
      };
      const data = await LogisticsReferenceModel.getAllVehicleTypes(filters);
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getVehicleTypes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getVehicleTypeById: async (req, res) => {
    try {
      const data = await LogisticsReferenceModel.getVehicleTypeById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Vehicle Type not found' });
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getVehicleTypeById:', error);
      res.status(500).json({ error: error.message });
    }
  },

  createVehicleType: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      const newId = await LogisticsReferenceModel.createVehicleType(req.body);
      res.status(201).json({ id: newId, message: 'Vehicle Type created successfully' });
    } catch (error) {
      console.error('[Controller] Error createVehicleType:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Vehicle Type Code must be unique' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  updateVehicleType: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      await LogisticsReferenceModel.updateVehicleType(req.params.id, req.body);
      res.json({ message: 'Vehicle Type updated successfully' });
    } catch (error) {
      console.error('[Controller] Error updateVehicleType:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // --- CONTAINER TYPES ---
  getContainerTypes: async (req, res) => {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status
      };
      const data = await LogisticsReferenceModel.getAllContainerTypes(filters);
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getContainerTypes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getContainerTypeById: async (req, res) => {
    try {
      const data = await LogisticsReferenceModel.getContainerTypeById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Container Type not found' });
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getContainerTypeById:', error);
      res.status(500).json({ error: error.message });
    }
  },

  createContainerType: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      const newId = await LogisticsReferenceModel.createContainerType(req.body);
      res.status(201).json({ id: newId, message: 'Container Type created successfully' });
    } catch (error) {
      console.error('[Controller] Error createContainerType:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Container Type Code must be unique' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  updateContainerType: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      await LogisticsReferenceModel.updateContainerType(req.params.id, req.body);
      res.json({ message: 'Container Type updated successfully' });
    } catch (error) {
      console.error('[Controller] Error updateContainerType:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // --- CARGO UNITS ---
  getCargoUnits: async (req, res) => {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status
      };
      const data = await LogisticsReferenceModel.getAllCargoUnits(filters);
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getCargoUnits:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getCargoUnitById: async (req, res) => {
    try {
      const data = await LogisticsReferenceModel.getCargoUnitById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Cargo Unit not found' });
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getCargoUnitById:', error);
      res.status(500).json({ error: error.message });
    }
  },

  createCargoUnit: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      const newId = await LogisticsReferenceModel.createCargoUnit(req.body);
      res.status(201).json({ id: newId, message: 'Cargo Unit created successfully' });
    } catch (error) {
      console.error('[Controller] Error createCargoUnit:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Cargo Unit Code must be unique' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  updateCargoUnit: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      await LogisticsReferenceModel.updateCargoUnit(req.params.id, req.body);
      res.json({ message: 'Cargo Unit updated successfully' });
    } catch (error) {
      console.error('[Controller] Error updateCargoUnit:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // --- SERVICE TYPES ---
  getServiceTypes: async (req, res) => {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status,
        job_order_type: req.query.job_order_type
      };
      const data = await LogisticsReferenceModel.getAllServiceTypes(filters);
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getServiceTypes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getServiceTypeById: async (req, res) => {
    try {
      const data = await LogisticsReferenceModel.getServiceTypeById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Service Type not found' });
      res.json(data);
    } catch (error) {
      console.error('[Controller] Error getServiceTypeById:', error);
      res.status(500).json({ error: error.message });
    }
  },

  createServiceType: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      const newId = await LogisticsReferenceModel.createServiceType(req.body);
      res.status(201).json({ id: newId, message: 'Service Type created successfully' });
    } catch (error) {
      console.error('[Controller] Error createServiceType:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Service Type Code must be unique' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  updateServiceType: async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and Name are required' });
      }
      await LogisticsReferenceModel.updateServiceType(req.params.id, req.body);
      res.json({ message: 'Service Type updated successfully' });
    } catch (error) {
      console.error('[Controller] Error updateServiceType:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = logisticsReferenceController;
