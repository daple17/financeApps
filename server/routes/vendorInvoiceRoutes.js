const express = require('express');
const router = express.Router();
const VendorInvoiceController = require('../controllers/vendorInvoiceController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Static Routes MUST be registered before dynamic routes like /:id
router.get('/eligible-costs', VendorInvoiceController.getEligibleCosts);


router.get('/dashboard', VendorInvoiceController.getDashboardSummary);

// Main Vendor Invoice CRUD
router.get('/', VendorInvoiceController.getAll);
router.post('/', VendorInvoiceController.createDraft);
router.get('/:id', VendorInvoiceController.getById);
router.put('/:id', VendorInvoiceController.updateDraft);
router.delete('/:id', VendorInvoiceController.deleteDraft);

// Items Management
router.post('/:id/items', VendorInvoiceController.addItem);
router.delete('/:id/items/:itemId', VendorInvoiceController.removeItem);

// Submit Transition
router.post('/:id/submit', requirePermission('vendor_invoice.submit'), VendorInvoiceController.submitInvoice);

// Revise Transition (Rejected -> Draft)
router.post('/:id/revise', requirePermission('vendor_invoice.edit'), VendorInvoiceController.reviseInvoice);

// Phase 5.5: Liability Posting
router.get('/:id/posting-preview', requirePermission('vendor_invoice.post'), VendorInvoiceController.getPostingPreview);
router.post('/:id/post', requirePermission('vendor_invoice.post'), VendorInvoiceController.postLiability);

module.exports = router;
