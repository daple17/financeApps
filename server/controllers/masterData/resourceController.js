const DriverModel = require('../../models/masterData/driverModel');
const VehicleModel = require('../../models/masterData/vehicleModel');

exports.getAllDrivers = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      availability: req.query.availability
    };
    const drivers = await DriverModel.findAll(filters);
    res.json({ status: 'success', data: drivers });
  } catch (error) {
    console.error('Error in getAllDrivers:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data driver' });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await DriverModel.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ status: 'error', message: 'Driver tidak ditemukan' });
    }
    res.json({ status: 'success', data: driver });
  } catch (error) {
    console.error('Error in getDriverById:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data driver' });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const data = { ...req.body, created_by: req.user.id };
    const driverId = await DriverModel.create(data);
    res.status(201).json({ status: 'success', message: 'Driver berhasil dibuat', data: { id: driverId } });
  } catch (error) {
    console.error('Error in createDriver:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Driver Code sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: 'Gagal membuat driver' });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const success = await DriverModel.update(req.params.id, req.body, req.user.id);
    if (!success) {
      return res.status(404).json({ status: 'error', message: 'Driver tidak ditemukan' });
    }
    res.json({ status: 'success', message: 'Driver berhasil diupdate' });
  } catch (error) {
    console.error('Error in updateDriver:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Driver Code sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate driver' });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      vehicle_type_id: req.query.vehicle_type_id
    };
    const vehicles = await VehicleModel.findAll(filters);
    res.json({ status: 'success', data: vehicles });
  } catch (error) {
    console.error('Error in getAllVehicles:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data vehicle' });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await VehicleModel.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ status: 'error', message: 'Vehicle tidak ditemukan' });
    }
    res.json({ status: 'success', data: vehicle });
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data vehicle' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const data = { ...req.body, created_by: req.user.id };
    const vehicleId = await VehicleModel.create(data);
    res.status(201).json({ status: 'success', message: 'Vehicle berhasil dibuat', data: { id: vehicleId } });
  } catch (error) {
    console.error('Error in createVehicle:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Vehicle Code atau Plate Number sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: 'Gagal membuat vehicle' });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const success = await VehicleModel.update(req.params.id, req.body, req.user.id);
    if (!success) {
      return res.status(404).json({ status: 'error', message: 'Vehicle tidak ditemukan' });
    }
    res.json({ status: 'success', message: 'Vehicle berhasil diupdate' });
  } catch (error) {
    console.error('Error in updateVehicle:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Vehicle Code atau Plate Number sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate vehicle' });
  }
};
