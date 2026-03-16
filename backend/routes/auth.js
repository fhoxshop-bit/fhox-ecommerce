const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.put('/update-admin-credentials', authController.updateAdminCredentials);

// Protected routes
router.get('/me', authController.verifyToken, authController.getCurrentUser);

module.exports = router;
