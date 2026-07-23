const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public Routes
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected Routes (Requires Bearer Token)
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
