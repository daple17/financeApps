const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requirePermission } = require('../middlewares/authMiddleware');

// Hanya user dengan permission '*' (Super Admin) atau 'users.*' yang bisa kelola User
router.use(authenticate);

router.get('/', requirePermission(['users.read']), userController.getAllUsers);
router.get('/:id', requirePermission(['users.read']), userController.getUserById);
router.post('/', requirePermission(['users.create']), userController.createUser);
router.put('/:id', requirePermission(['users.update']), userController.updateUser);
router.delete('/:id', requirePermission(['users.delete']), userController.deleteUser);

module.exports = router;
