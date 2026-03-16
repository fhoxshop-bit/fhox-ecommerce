const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { verifyToken } = require('../controllers/authController')

// Legacy endpoints
router.get('/', userController.getUsers)
router.post('/', express.json(), userController.createUser)

// Cart endpoints
router.get('/cart/items', verifyToken, userController.getCart)
router.post('/cart/add', verifyToken, userController.addToCart)
router.post('/cart/update', verifyToken, userController.updateCartItem)
router.post('/cart/remove', verifyToken, userController.removeFromCart)
router.post('/cart/clear', verifyToken, userController.clearCart)

// Wishlist endpoints
router.get('/wishlist/items', verifyToken, userController.getWishlist)
router.post('/wishlist/add', verifyToken, userController.addToWishlist)
router.post('/wishlist/remove', verifyToken, userController.removeFromWishlist)
router.post('/wishlist/clear', verifyToken, userController.clearWishlist)

module.exports = router