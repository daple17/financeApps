const express = require('express');
const TransactionController = require('../controllers/transactionController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('transactions.read'), TransactionController.getAll);
router.get('/:id', requirePermission('transactions.read'), TransactionController.getById);
router.post('/', requirePermission('transactions.create'), TransactionController.create);

module.exports = router;
