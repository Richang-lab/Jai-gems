const express = require('express');
const router = express.Router();
const invController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All inventory routes require at least authentication
router.use(authenticate);

// -----------------------------------------------------------------
// Configuration (Categories, Stones, Materials)
// -----------------------------------------------------------------
router.get('/config', invController.getConfig);

// Admin only config writes
router.post('/categories', requireRole('admin'), invController.addCategory);
router.delete('/categories/:id', requireRole('admin'), invController.deleteCategory);

router.post('/shapes', requireRole('admin'), invController.addStoneShape);
router.delete('/shapes/:id', requireRole('admin'), invController.deleteStoneShape);

router.post('/materials', requireRole('admin'), invController.addMaterial);
router.delete('/materials/:id', requireRole('admin'), invController.deleteMaterial);

// -----------------------------------------------------------------
// Finished Goods
// -----------------------------------------------------------------
router.get('/finished-goods', invController.getFinishedGoods);
router.post('/finished-goods/bulk', requireRole('admin'), invController.bulkUploadFinishedGoods);
router.post('/finished-goods', requireRole('admin'), invController.createFinishedGood);
router.put('/finished-goods/:id', requireRole('admin'), invController.updateFinishedGood);
router.delete('/finished-goods/:id', requireRole('admin'), invController.deleteFinishedGood);

// -----------------------------------------------------------------
// Raw Materials (Wax / Casting)
// -----------------------------------------------------------------
router.get('/wax', invController.getWaxInventory);
// Used for both adding new stocks or deducting from stock
router.post('/wax/transaction', requireRole('admin'), invController.postWaxInventory);
router.delete('/wax/:id', requireRole('admin'), invController.deleteWaxInventory);

router.get('/casting', invController.getCastingInventory);
router.post('/casting/bulk', requireRole('admin'), invController.bulkUploadCasting);
router.post('/casting/transaction', requireRole('admin'), invController.postCastingInventory);
router.delete('/casting/:id', requireRole('admin'), invController.deleteCastingInventory);

// Casting Attributes
router.get('/casting-attributes', invController.getCastingAttributes);
router.post('/casting-attributes', requireRole('admin'), invController.addCastingAttribute);
router.delete('/casting-attributes/:id', requireRole('admin'), invController.deleteCastingAttribute);

// Cross-Module Cascading Delete
router.get('/check-delete/:module/:id', invController.checkDeleteDependencies);
router.post('/cross-delete', requireRole('admin'), invController.executeCrossDelete);

// Administration 
router.delete('/destroy-all', requireRole('admin'), invController.deleteAllInventory);

module.exports = router;
