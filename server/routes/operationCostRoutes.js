const express = require('express');
const router = express.Router();
const operationCostController = require('../controllers/operationCostController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/operations/:operationId/costs', requirePermission(['operation_cost.view']), operationCostController.getOperationCosts);
router.post('/operations/:operationId/costs', requirePermission(['operation_cost.create']), operationCostController.createOperationCost);
router.get('/operation-costs/:id', requirePermission(['operation_cost.view']), operationCostController.getOperationCostById);
router.put('/operation-costs/:id', requirePermission(['operation_cost.edit']), operationCostController.updateOperationCost);
router.delete('/operation-costs/:id', requirePermission(['operation_cost.delete']), operationCostController.deleteOperationCost);
router.post('/operation-costs/:id/status', requirePermission(['operation_cost.submit', 'operation_cost.approve']), operationCostController.updateOperationCostStatus);

module.exports = router;
