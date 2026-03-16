const router = require('express').Router();
const couponController = require('../controllers/couponController');

// Generate new coupon (admin)
router.post('/generate', couponController.generateCoupon);

// Get all coupons (admin)
router.get('/', couponController.getCoupons);

// Get users by category (for distribution)
router.get('/users-by-category', couponController.getUsersByCategory);

// Send coupon to selected users (admin)
router.post('/send-to-users', couponController.sendCouponToUsers);

// Get user's available coupons
router.get('/user/:userId', couponController.getUserCoupons);

// Validate coupon before applying
router.post('/validate', couponController.validateCoupon);

// Apply coupon to order
router.post('/apply', couponController.applyCoupon);

// DEBUG: Check coupon assignment status for a user
router.get('/debug/assignments/:userId/:couponCode', couponController.debugAssignments);

// Update coupon (admin)
router.put('/:id', couponController.updateCoupon);

// Delete coupon (admin)
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
