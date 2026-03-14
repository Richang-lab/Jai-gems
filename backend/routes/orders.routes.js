const express = require('express');
const router = express.Router();
const {
    getSettings, updateSetting,
    getOrders, getOrder, createOrder, deleteOrder, updateOrderItem
} = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);

// App Settings (casting rate etc.)
router.get('/settings', getSettings);
router.post('/settings', requireRole('admin'), updateSetting);

// Orders
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', requireRole('admin'), createOrder);
router.delete('/:id', requireRole('admin'), deleteOrder);

// Order Item status update
router.put('/items/:itemId', requireRole('admin'), updateOrderItem);

module.exports = router;
