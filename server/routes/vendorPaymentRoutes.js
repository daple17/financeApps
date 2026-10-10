const express = require('express');
const router = express.Router();
const VendorPaymentController = require('../controllers/vendorPaymentController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Preview
router.post('/preview', requirePermission('vendor_payment.post'), VendorPaymentController.preview);

// Create / Post
router.post('/', requirePermission('vendor_payment.post'), VendorPaymentController.create);

// List
router.get('/', requirePermission('vendor_payment.view'), VendorPaymentController.getPayments);

// Detail
router.get('/:id', requirePermission('vendor_payment.view'), VendorPaymentController.getPaymentById);

module.exports = router;
