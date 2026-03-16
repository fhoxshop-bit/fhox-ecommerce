const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getSubscribers } = require('../controllers/newsletterController');

// Subscribe to newsletter
router.post('/subscribe', subscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe', unsubscribe);

// Get all subscribers (admin)
router.get('/subscribers', getSubscribers);

module.exports = router;
