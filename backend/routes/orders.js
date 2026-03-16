const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const orderController = require('../controllers/orderController');

// create new order (user must be logged in)
router.post('/', verifyToken, orderController.createOrder);

// get orders for logged-in user
router.get('/user', verifyToken, orderController.getUserOrders);

// cancel by user
router.post('/:id/cancel', verifyToken, orderController.cancelOrder);

// request refund/return (user)
router.post('/:id/request-refund', verifyToken, orderController.requestRefund);

// get refund status
router.get('/:id/refund-status', verifyToken, orderController.getRefundStatus);

// process refund (admin)
router.post('/:id/process-refund', verifyToken, orderController.processRefund);

// update status (admin)
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);

// list all orders (admin)
router.get('/', orderController.getAllOrders);

module.exports = router;