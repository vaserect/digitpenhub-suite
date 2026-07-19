const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const printFulfillmentController = require('../controllers/printFulfillmentController');

const router = express.Router();
const checkAccess = [requireAuth, requireModuleAccess('print-fulfillment-for-business-cards-signage')];

// Catalog (Public or Protected, let's keep under checkAccess to respect plan limit)
router.get('/catalog', checkAccess, printFulfillmentController.listProducts);
router.get('/catalog/:id', checkAccess, printFulfillmentController.getProduct);

// Orders
router.get('/orders', checkAccess, printFulfillmentController.listOrders);
router.get('/orders/:id', checkAccess, printFulfillmentController.getOrder);
router.post('/orders', checkAccess, printFulfillmentController.placeOrder);
router.put('/orders/:id/simulate', checkAccess, printFulfillmentController.simulateOrderAdvance);

// Analytics
router.get('/analytics', checkAccess, printFulfillmentController.getAnalytics);

module.exports = router;
