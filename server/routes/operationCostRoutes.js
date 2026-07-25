const express = require('express');
const router = express.Router();
const operationCostController = require('../controllers/operationCostController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/operations/:operationId/costs', operationCostController.getOperationCosts);
router.post('/operations/:operationId/costs', operationCostController.createOperationCost);
router.get('/operation-costs/:id', operationCostController.getOperationCostById);
router.put('/operation-costs/:id', operationCostController.updateOperationCost);
router.delete('/operation-costs/:id', operationCostController.deleteOperationCost);
router.post('/operation-costs/:id/status', operationCostController.updateOperationCostStatus);

module.exports = router;
