const express = require('express');
const ApprovalController = require('../controllers/approvalController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/pending', requirePermission('approvals.read'), ApprovalController.getPending);
router.post('/:id/approve', requirePermission('approvals.manage'), ApprovalController.approve);
router.post('/:id/reject', requirePermission('approvals.manage'), ApprovalController.reject);

module.exports = router;
