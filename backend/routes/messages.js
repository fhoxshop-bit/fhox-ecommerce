const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const nodemailer = require('nodemailer');

// Create a new message (contact form submission)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const newMessage = new Message({
      name,
      email,
      subject,
      message
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

// Get all messages (admin only)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Get unread message count (for notification badge)
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.countDocuments({ status: 'unread' });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Update message status (mark as read)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Failed to update message status' });
  }
});

// Reply to a message (admin functionality)
router.post('/:id/reply', async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email but saving reply.');
      
      // Still save the reply to database even if email isn't sent
      message.adminReply = replyMessage;
      message.status = 'replied';
      message.repliedAt = new Date();
      await message.save();

      return res.json({
        success: true,
        message: 'Reply saved successfully! (Email not sent - credentials not configured)'
      });
    }

    // ensure email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS in environment.'
      });
    }

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: message.email,
      subject: `Re: ${message.subject.charAt(0).toUpperCase() + message.subject.slice(1)} - FHOX Support`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">FHOX Support Response</h2>
          <p>Dear ${message.name},</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Original Message:</h3>
            <p style="color: #666; font-style: italic;">"${message.message}"</p>
          </div>

          <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b35;">
            <h3>Our Response:</h3>
            <p>${replyMessage}</p>
          </div>

          <p style="margin-top: 30px;">Best regards,<br>FHOX Support Team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #888;">
            This is an automated response from FHOX Support. Please do not reply to this email.
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Update message in database
    message.adminReply = replyMessage;
    message.status = 'replied';
    message.repliedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Reply sent successfully!'
    });

  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply. Please try again.'
    });
  }
});

module.exports = router;