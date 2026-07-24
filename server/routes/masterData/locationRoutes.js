const express = require('express');
const router = express.Router();
const countryController = require('../../controllers/masterData/countryController');
const portController = require('../../controllers/masterData/portController');
const warehouseController = require('../../controllers/masterData/warehouseController');
const { authenticate } = require('../../middlewares/authMiddleware');

router.use(authenticate);

// Countries
router.get('/countries', countryController.getAllCountries);
router.get('/countries/:id', countryController.getCountryById);
router.post('/countries', countryController.createCountry);
router.put('/countries/:id', countryController.updateCountry);

// Ports
router.get('/ports', portController.getAllPorts);
router.get('/ports/:id', portController.getPortById);
router.post('/ports', portController.createPort);
router.put('/ports/:id', portController.updatePort);

// Warehouses
router.get('/warehouses', warehouseController.getAllWarehouses);
router.get('/warehouses/:id', warehouseController.getWarehouseById);
router.post('/warehouses', warehouseController.createWarehouse);
router.put('/warehouses/:id', warehouseController.updateWarehouse);

module.exports = router;
