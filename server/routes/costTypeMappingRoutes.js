const express = require('express');
const router = express.Router();
const CostTypeMappingController = require('../controllers/costTypeMappingController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Assume RBAC checks happen here in a real app (e.g. auth.check('settlement.view'))

router.get('/', CostTypeMappingController.getAll);
router.post('/', CostTypeMappingController.create);
router.put('/:id', CostTypeMappingController.update);

module.exports = router;
