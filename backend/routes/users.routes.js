const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUser, deleteUser, getRoles } = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All user management routes require admin role
router.use(authenticate, requireRole('admin'));

router.get('/roles', getRoles);
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
