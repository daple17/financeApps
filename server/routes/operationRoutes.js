const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');
const documentController = require('../controllers/documentController');
const upload = require('../middlewares/uploadMiddleware');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('operations.read'), operationController.getAllOperations);
router.post('/', requirePermission('operations.create'), operationController.createOperation);
router.get('/:id', requirePermission('operations.read'), operationController.getOperationById);
router.put('/:id', requirePermission('operations.edit'), operationController.updateOperation);
router.put('/:id/status', requirePermission('operations.status.change'), operationController.updateOperationStatus);
router.get('/:id/events', requirePermission('operations.read'), operationController.getOperationEvents);
router.get('/:id/assignment', requirePermission('operations.read'), operationController.getAssignment);
router.post('/:id/assignment', requirePermission('operations.edit'), operationController.assignResource);
router.delete('/:id/assignment', requirePermission('operations.edit'), operationController.releaseResource);

// Document Routes
router.get('/:id/documents', requirePermission('operations.read'), documentController.getOperationDocuments);
router.post('/:id/documents', requirePermission('operations.edit'), upload.single('file'), documentController.uploadDocument);
router.delete('/:id/documents/:docId', requirePermission('operations.edit'), documentController.deleteDocument);

// POD Routes
router.get('/:id/pod', requirePermission('operations.read'), documentController.getPod);
router.post('/:id/pod', requirePermission('operations.edit'), upload.single('file'), documentController.submitPod);
router.put('/:id/pod/verify', requirePermission('operations.status.change'), documentController.verifyPod);

module.exports = router;
