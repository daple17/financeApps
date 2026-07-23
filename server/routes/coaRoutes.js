const express = require('express');
const CoaController = require('../controllers/coaController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('coa.read'), CoaController.getAll);
router.get('/:id', requirePermission('coa.read'), CoaController.getById);
router.post('/', requirePermission('coa.create'), CoaController.create);
router.put('/:id', requirePermission('coa.update'), CoaController.update);
router.delete('/:id', requirePermission('coa.delete'), CoaController.delete);

module.exports = router;
