const express = require('express');
const router = express.Router();
const { listClients, createClient, updateClient, deleteClient } = require('../controllers/clients.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All client routes require at least authentication
router.use(authenticate);

// Everyone authenticated can view clients
router.get('/', listClients);

// Only admins can create, update, delete clients
router.post('/', requireRole('admin'), createClient);
router.put('/:id', requireRole('admin'), updateClient);
router.delete('/:id', requireRole('admin'), deleteClient);

module.exports = router;
