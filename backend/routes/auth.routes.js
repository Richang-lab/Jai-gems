const express = require('express');
const router = express.Router();
const { login, getMe, refreshToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;
