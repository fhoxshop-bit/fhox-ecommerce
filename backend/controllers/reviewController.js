const Review = require('../models/Review');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.addReview = [verifyToken, async (req, res) => {
  try {
    const { productId, customerName, customerEmail, rating, reviewText } = req.body;

    if (!productId || !customerName || !customerEmail || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check for duplicate review from same email for same product
    const existingReview = await Review.findOne({
      productId: String(productId),
      customerEmail: customerEmail.toLowerCase()
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create new review
    const review = new Review({
      productId: String(productId),
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      rating: parseInt(rating),
      reviewText,
      verified: true // Mark as verified since user is logged in
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding review',
      error: error.message
    });
  }
}];

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId: String(productId) })
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews',
      error: error.message
    });
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId: String(productId) });

    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error calculating average rating:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating rating',
      error: error.message
    });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews',
      error: error.message
    });
  }
};
