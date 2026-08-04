const express = require('express');
const TransactionController = require('../controllers/transactionController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('transactions.read'), TransactionController.getAll);
router.get('/:id', requirePermission('transactions.read'), TransactionController.getById);
router.post('/', requirePermission('transactions.create'), TransactionController.create);
router.put('/:id', requirePermission('transactions.manage'), TransactionController.update);
router.delete('/:id', requirePermission('transactions.manage'), TransactionController.delete);

module.exports = router;
