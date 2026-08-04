const express = require('express');
const router = express.Router();
const SettlementController = require('../controllers/settlementController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Main Settlement CRUD
router.get('/', SettlementController.getAll);
router.get('/eligible-advances', SettlementController.getEligibleAdvances);
router.post('/', SettlementController.createDraft);
router.get('/:id', SettlementController.getById);
router.put('/:id', SettlementController.update);
router.delete('/:id', SettlementController.delete);

// Items Management
router.get('/:id/eligible-costs', SettlementController.getEligibleCosts);
router.post('/:id/items', SettlementController.addItem);
router.delete('/:id/items/:itemId', SettlementController.removeItem);

// Submit Transition
router.post('/:id/submit', requirePermission('settlement.submit'), SettlementController.submit);
router.post('/:id/revise', requirePermission('settlement.edit'), SettlementController.revise);

// Posting
router.post('/:id/posting-preview', requirePermission('settlement.post'), SettlementController.postingPreview);
router.post('/:id/post', requirePermission('settlement.post'), SettlementController.post);

module.exports = router;
