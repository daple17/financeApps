const express = require('express');
const router = express.Router();
const resourceController = require('../../controllers/masterData/resourceController');
const { authenticate, requirePermission } = require('../../middlewares/authMiddleware');

router.use(authenticate);

// Drivers
router.get('/drivers', requirePermission('master_data.read'), resourceController.getAllDrivers);
router.post('/drivers', requirePermission('master_data.create'), resourceController.createDriver);
router.get('/drivers/:id', requirePermission('master_data.read'), resourceController.getDriverById);
router.put('/drivers/:id', requirePermission('master_data.update'), resourceController.updateDriver);

// Vehicles
router.get('/vehicles', requirePermission('master_data.read'), resourceController.getAllVehicles);
router.post('/vehicles', requirePermission('master_data.create'), resourceController.createVehicle);
router.get('/vehicles/:id', requirePermission('master_data.read'), resourceController.getVehicleById);
router.put('/vehicles/:id', requirePermission('master_data.update'), resourceController.updateVehicle);

module.exports = router;
