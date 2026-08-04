const express = require('express');
const router = express.Router();
const cashAdvanceController = require('../controllers/cashAdvanceController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Get all cash advances
router.get('/', requirePermission('cash_advance.view'), cashAdvanceController.getAll);

// Get eligible source accounts for disbursement
router.get('/eligible-source-accounts', requirePermission('cash_advance.disburse'), cashAdvanceController.getEligibleSourceAccounts);

// Get single cash advance
router.get('/:id', requirePermission('cash_advance.view'), cashAdvanceController.getById);

// Create cash advance
router.post('/', requirePermission('cash_advance.create'), cashAdvanceController.create);

// Update cash advance
router.put('/:id', requirePermission('cash_advance.edit'), cashAdvanceController.update);

// Submit cash advance
router.post('/:id/submit', requirePermission('cash_advance.submit'), cashAdvanceController.submit);

// Delete cash advance
router.delete('/:id', requirePermission('cash_advance.delete'), cashAdvanceController.delete);

// Disburse cash advance
router.post('/:id/disburse', requirePermission('cash_advance.disburse'), cashAdvanceController.disburse);

module.exports = router;
