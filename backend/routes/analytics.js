const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics endpoints
router.get('/revenue', analyticsController.getRevenueData);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/categories', analyticsController.getCategoryData);
router.get('/monthly-orders', analyticsController.getMonthlyOrders);
router.get('/order-status', analyticsController.getOrderStatus);
router.get('/user-growth', analyticsController.getUserGrowth);
router.get('/top-customers', analyticsController.getTopCustomers);
router.get('/overall-stats', analyticsController.getOverallStats);

module.exports = router;
