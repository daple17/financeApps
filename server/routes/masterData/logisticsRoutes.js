const express = require('express');
const router = express.Router();
const logisticsReferenceController = require('../../controllers/masterData/logisticsReferenceController');

// Vehicle Types
router.get('/vehicle-types', logisticsReferenceController.getVehicleTypes);
router.get('/vehicle-types/:id', logisticsReferenceController.getVehicleTypeById);
router.post('/vehicle-types', logisticsReferenceController.createVehicleType);
router.put('/vehicle-types/:id', logisticsReferenceController.updateVehicleType);

// Container Types
router.get('/container-types', logisticsReferenceController.getContainerTypes);
router.get('/container-types/:id', logisticsReferenceController.getContainerTypeById);
router.post('/container-types', logisticsReferenceController.createContainerType);
router.put('/container-types/:id', logisticsReferenceController.updateContainerType);

// Cargo Units
router.get('/cargo-units', logisticsReferenceController.getCargoUnits);
router.get('/cargo-units/:id', logisticsReferenceController.getCargoUnitById);
router.post('/cargo-units', logisticsReferenceController.createCargoUnit);
router.put('/cargo-units/:id', logisticsReferenceController.updateCargoUnit);

// Service Types
router.get('/service-types', logisticsReferenceController.getServiceTypes);
router.get('/service-types/:id', logisticsReferenceController.getServiceTypeById);
router.post('/service-types', logisticsReferenceController.createServiceType);
router.put('/service-types/:id', logisticsReferenceController.updateServiceType);

module.exports = router;
