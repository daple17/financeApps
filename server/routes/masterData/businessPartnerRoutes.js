const express = require('express');
const router = express.Router();
const BusinessPartnerController = require('../../controllers/masterData/businessPartnerController');
const { authenticate } = require('../../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', BusinessPartnerController.getAll);
router.get('/:id', BusinessPartnerController.getById);
router.post('/', BusinessPartnerController.create);
router.put('/:id', BusinessPartnerController.update);

module.exports = router;
