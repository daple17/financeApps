const express = require('express');
const router = express.Router();
const jobOrderController = require('../controllers/jobOrderController');
const operationController = require('../controllers/operationController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

// Base middleware for all job order routes
router.use(authenticate);

// List Job Orders
// Usually operations or admin can read
router.get('/', requirePermission(['job_orders.read']), jobOrderController.getJobOrders);

// Create Job Order
router.post('/', requirePermission(['job_orders.create']), jobOrderController.createJobOrder);

// Get Job Order Detail
router.get('/:id', requirePermission(['job_orders.read']), jobOrderController.getJobOrderDetail);

// Update Job Order
router.put('/:id', requirePermission(['job_orders.update']), jobOrderController.updateJobOrder);

// Operations for a Job Order
router.get('/:id/operations', requirePermission('job_orders.read'), operationController.getOperationsByJobOrder);

// Allocation balance for a Job Order
router.get('/:id/allocation-balance', requirePermission('job_orders.read'), operationController.getAllocationBalance);

module.exports = router;
