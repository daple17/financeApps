const express = require('express');
const BudgetController = require('../controllers/budgetController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('budgets.read'), BudgetController.getBudgets);
router.post('/', requirePermission('budgets.manage'), BudgetController.setBudget);

module.exports = router;
