const Newsletter = require('../models/Newsletter');
const { sendSubscriptionConfirmation, sendUnsubscribeConfirmation } = require('../utils/emailService');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existingSubscriber) {
      if (!existingSubscriber.isActive) {
        // Reactivate if previously unsubscribed
        existingSubscriber.isActive = true;
        await existingSubscriber.save();
        
        // Send resubscription email
        try {
          await sendSubscriptionConfirmation(email.toLowerCase());
        } catch (emailError) {
          console.error('Failed to send resubscription email:', emailError);
          // Still return success even if email fails, as subscription was saved
        }

        return res.status(200).json({
          success: true,
          message: 'You have been re-subscribed to our newsletter! Check your email for confirmation.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed to our newsletter.'
      });
    }

    // Create new subscriber
    const newSubscriber = new Newsletter({ email: email.toLowerCase() });
    await newSubscriber.save();

    // Send subscription confirmation email
    try {
      await sendSubscriptionConfirmation(email.toLowerCase());
    } catch (emailError) {
      console.error('Failed to send subscription confirmation email:', emailError);
      // Still return success even if email fails, as subscription was saved
      return res.status(201).json({
        success: true,
        message: 'Subscription successful! Check your email for confirmation (may take a minute).'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! Check your email for confirmation.'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const subscriber = await Newsletter.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isActive: false },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter.'
      });
    }

    // Send unsubscribe confirmation email
    try {
      await sendUnsubscribeConfirmation(email.toLowerCase());
    } catch (emailError) {
      console.error('Failed to send unsubscribe confirmation email:', emailError);
      // Still return success even if email fails, as unsubscription was processed
    }

    res.status(200).json({
      success: true,
      message: 'You have been unsubscribed from our newsletter.'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe. Please try again later.'
    });
  }
};

// Get all active subscribers (admin only)
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).select('email subscribedAt');
    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscribers.'
    });
  }
};
