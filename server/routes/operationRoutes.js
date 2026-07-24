const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('operations.read'), operationController.getAllOperations);
router.post('/', requirePermission('operations.create'), operationController.createOperation);
router.get('/:id', requirePermission('operations.read'), operationController.getOperationById);
router.put('/:id', requirePermission('operations.edit'), operationController.updateOperation);
router.put('/:id/status', requirePermission('operations.status.change'), operationController.updateOperationStatus);
router.get('/:id/events', requirePermission('operations.read'), operationController.getOperationEvents);

module.exports = router;
