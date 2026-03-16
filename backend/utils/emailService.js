const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send newsletter subscription confirmation email
const sendSubscriptionConfirmation = async (email) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to FHOX Newsletter! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to FHOX!</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for subscribing to our newsletter! 🙌
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You're now part of the FHOX family. Get ready to receive:
            </p>
            
            <ul style="font-size: 16px; color: #333; line-height: 1.8;">
              <li>✨ Exclusive fashion tips and trends</li>
              <li>🎁 Special offers and promotions</li>
              <li>🆕 First access to new collections</li>
              <li>📰 Behind-the-scenes updates</li>
            </ul>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; line-height: 1.6;">
              If you no longer want to receive emails from us, you can unsubscribe anytime by replying to any email with "unsubscribe".
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                © 2024 FHOX. All rights reserved.<br>
                123 Fashion Street, New York, NY 10001
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to FHOX Newsletter!\n\nThank you for subscribing!\n\nYou're now part of the FHOX family and will receive exclusive offers, fashion tips, and early access to new collections.\n\nBest regards,\nFHOX Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Subscription confirmation email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    throw error;
  }
};

// Send newsletter unsubscribe confirmation email
const sendUnsubscribeConfirmation = async (email) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'You\'ve been unsubscribed from FHOX Newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Unsubscribed</h2>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You have been unsubscribed from the FHOX newsletter.
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We hope to see you again soon! If you change your mind, you can always subscribe again on our website.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                © 2024 FHOX. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `You have been unsubscribed from the FHOX newsletter.\n\nIf you change your mind, you can always subscribe again on our website.\n\nBest regards,\nFHOX Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Unsubscribe confirmation email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending unsubscribe confirmation email:', error);
    throw error;
  }
};

// Send coupon code email
const sendCouponEmail = async (email, couponCode, discountPercentage, expiryDate, targetSegment) => {
  try {
    const segmentText = {
      'NEW': 'for new customers',
      'ALL': 'for all customers',
      'TOP_BUYERS': 'for our valued customers',
      'INACTIVE': 'to welcome you back'
    }[targetSegment] || 'exclusive coupon';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎉 Your ${discountPercentage}% Exclusive Coupon is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Special Offer!</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Get ${discountPercentage}% OFF Your Next Purchase</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Hi there! 👋
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We have a special ${discountPercentage}% discount coupon ${segmentText}. Use the code below at checkout and get instant savings!
            </p>
            
            <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%); border: 2px dashed #ff6b6b; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your Coupon Code</p>
              <h2 style="font-size: 36px; color: #ff6b6b; margin: 0; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 3px;">${couponCode}</h2>
              <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">Copy and paste at checkout</p>
            </div>
            
            <div style="background-color: #f0f8ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="font-size: 14px; color: #004085; margin: 0;">
                <strong>Valid until:</strong> ${expiryDate}<br>
                <strong>Discount:</strong> ${discountPercentage}% off your total purchase
              </p>
            </div>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 25px;">
              Don't miss out! Use this coupon now and enjoy your shopping! 🛍️
            </p>
            
            <a href="${process.env.SHOP_URL || 'https://yourshop.com'}" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin-top: 20px; font-weight: bold; font-size: 16px;">
              Shop Now
            </a>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                © 2024 FHOX. All rights reserved.<br>
                This is an exclusive offer. Don't share this code to keep it special!
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Special Offer: ${discountPercentage}% OFF\n\nYour Coupon Code: ${couponCode}\n\nValid until: ${expiryDate}\n\nUse this code at checkout to get ${discountPercentage}% discount on your total purchase.\n\nShop now and enjoy your savings!\n\nBest regards,\nFHOX Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Coupon email sent to', email, ':', info.response);
    return true;
  } catch (error) {
    console.error('Error sending coupon email:', error);
    // Don't throw - coupon should still work even if email fails
    return false;
  }
};

module.exports = {
  sendSubscriptionConfirmation,
  sendUnsubscribeConfirmation,
  sendCouponEmail,
};
