const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getAllReviews,
  addReview,
  getAverageRating
} = require('../controllers/reviewController');

// Get all reviews for a specific product
router.get('/product/:productId', getProductReviews);

// Get average rating for a product
router.get('/product/:productId/rating', getAverageRating);

// Get all reviews (for reviews page)
router.get('/', getAllReviews);

// Add a new review
router.post('/add', addReview);

module.exports = router;
