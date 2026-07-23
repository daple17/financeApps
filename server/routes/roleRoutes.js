const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

// Hanya user dengan permission '*' (Super Admin) atau 'roles.*' yang bisa kelola Role
router.use(authenticate);

router.get('/', requirePermission(['roles.read']), roleController.getAllRoles);
router.get('/:id', requirePermission(['roles.read']), roleController.getRoleById);
router.post('/', requirePermission(['roles.create']), roleController.createRole);
router.put('/:id', requirePermission(['roles.update']), roleController.updateRole);
router.delete('/:id', requirePermission(['roles.delete']), roleController.deleteRole);

module.exports = router;
