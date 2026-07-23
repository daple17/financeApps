const express = require('express');
const ReportController = require('../controllers/reportController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/income-statement', requirePermission('reports.read'), ReportController.getIncomeStatement);
router.get('/balance-sheet', requirePermission('reports.read'), ReportController.getBalanceSheet);
router.get('/general-ledger', requirePermission('reports.read'), ReportController.getGeneralLedger);
router.get('/dashboard-summary', requirePermission('reports.read'), ReportController.getDashboardSummary);

module.exports = router;
