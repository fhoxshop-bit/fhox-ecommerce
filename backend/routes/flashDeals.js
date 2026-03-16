const express = require('express')
const router = express.Router()
const flashDealsController = require('../controllers/flashDealsController')

// Public routes
router.get('/active', flashDealsController.getFlashDeals)
router.get('/:id', flashDealsController.getFlashDealById)

// Admin routes (would need auth middleware in production)
router.get('/', flashDealsController.getAllFlashDeals)
router.post('/', flashDealsController.createFlashDeal)
router.put('/:id', flashDealsController.updateFlashDeal)
router.delete('/:id', flashDealsController.deleteFlashDeal)

module.exports = router
