const express = require('express');
const router = express.Router();
const VendorPaymentController = require('../controllers/vendorPaymentController');
const { authMiddleware, hasPermission } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Preview
router.post('/preview', hasPermission('vendor_payment.post'), VendorPaymentController.preview);

// Create / Post
router.post('/', hasPermission('vendor_payment.post'), VendorPaymentController.create);

// List
router.get('/', hasPermission('vendor_payment.view'), VendorPaymentController.getPayments);

// Detail
router.get('/:id', hasPermission('vendor_payment.view'), VendorPaymentController.getPaymentById);

module.exports = router;
