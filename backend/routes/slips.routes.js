const express = require('express');
const router = express.Router();
const { getPendingWork, generateSlip, getSlips } = require('../controllers/slips.controller');
const { authenticate } = require('../middleware/auth');

// Allow authorized employees to generate and view
router.use(authenticate);

// Get pending tasks by requested process type
router.get('/pending/:type', getPendingWork);

// Fetch existing generated slips tracking page
router.get('/', getSlips);

// Post a physical slip action
router.post('/generate', generateSlip);

module.exports = router;
