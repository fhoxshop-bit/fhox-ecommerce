const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOrderEmail = async (userEmail, orderData, status) => {
  try {
    let subject = '';
    let htmlContent = '';

    const baseUrl = 'http://localhost:5173';
    const trackingLink = `${baseUrl}/orders`;

    if (status === 'placed') {
      subject = 'Order Confirmed - Waiting for Acceptance';
      htmlContent = `
        <h2>Your Order Has Been Placed!</h2>
        <p>Hi ${userEmail},</p>
        <p>Your order #${orderData._id} has been placed successfully.</p>
        <p><strong>Order Total:</strong> ₹${orderData.total.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</p>
        <p><strong>Status:</strong> Pending Admin Acceptance</p>
        <p>The admin will review and accept your order shortly.</p>
        <p><a href="${trackingLink}">Track Your Order</a></p>
      `;
    } else if (status === 'accepted') {
      subject = 'Order Accepted - Your Order is Processing';
      htmlContent = `
        <h2>Your Order Has Been Accepted!</h2>
        <p>Hi ${userEmail},</p>
        <p>Great news! Your order #${orderData._id} has been accepted by our admin.</p>
        <p><strong>Current Status:</strong> Accepted</p>
        <p>We are preparing to ship your order shortly.</p>
        <p><a href="${trackingLink}">Track Your Order</a></p>
      `;
    } else if (status === 'shipped') {
      subject = 'Order Shipped - Your Package is On The Way!';
      htmlContent = `
        <h2>Your Order Has Been Shipped!</h2>
        <p>Hi ${userEmail},</p>
        <p>Your order #${orderData._id} is on its way to you!</p>
        <p><strong>Current Status:</strong> Shipped</p>
        <p>You can now track your package using the link below.</p>
        <p><a href="${trackingLink}">Track Your Order</a></p>
      `;
    } else if (status === 'delivered') {
      subject = 'Order Delivered - Thank You For Your Purchase!';
      htmlContent = `
        <h2>Your Order Has Been Delivered!</h2>
        <p>Hi ${userEmail},</p>
        <p>Your order #${orderData._id} has been successfully delivered!</p>
        <p><strong>Current Status:</strong> Delivered</p>
        <p>Thank you for shopping with us. We hope you enjoy your purchase!</p>
        <p><a href="${trackingLink}">View Your Order</a></p>
      `;
    } else if (status === 'cancelled') {
      subject = 'Order Cancelled - Your Refund is Processing';
      htmlContent = `
        <h2>Your Order Has Been Cancelled</h2>
        <p>Hi ${userEmail},</p>
        <p>Your order #${orderData._id} has been cancelled.</p>
        <p><strong>Refund Amount:</strong> ₹${orderData.total.toFixed(2)}</p>
        <p><strong>Refund Timeline:</strong> 5-7 business days</p>
        <p>Your refund will be credited back to your original payment method.</p>
        <p>If you have any questions, please contact us.</p>
        <p><a href="${trackingLink}">View Your Order</a></p>
      `;
    } else if (status === 'refunded') {
      subject = 'Refund Processed - Funds Returned to Your Account';
      htmlContent = `
        <h2>Your Refund Has Been Processed!</h2>
        <p>Hi ${userEmail},</p>
        <p>Your refund for order #${orderData._id} has been successfully processed.</p>
        <p><strong>Refund Amount:</strong> ₹${orderData.refund.amount.toFixed(2)}</p>
        <p><strong>Refund ID:</strong> ${orderData.refund.razorpayRefundId || 'N/A'}</p>
        <p><strong>Processed On:</strong> ${new Date(orderData.refund.processedAt).toLocaleDateString()}</p>
        <p>The funds will appear in your account within 5-7 business days depending on your bank.</p>
        <p>Thank you for your understanding!</p>
        <p><a href="${trackingLink}">View Your Order</a></p>
      `;
    } else if (status === 'return_requested') {
      subject = 'Return Request Received - Awaiting Admin Approval';
      htmlContent = `
        <h2>Return Request Received</h2>
        <p>Hi ${userEmail},</p>
        <p>We have received your return request for order #${orderData._id}.</p>
        <p><strong>Refund Amount:</strong> ₹${orderData.total.toFixed(2)}</p>
        <p><strong>Reason:</strong> ${orderData.refund.reason}</p>
        <p>Our admin team will review your request and process your refund within 3-5 business days.</p>
        <p>You will receive a confirmation email once your refund is processed.</p>
        <p><a href="${trackingLink}">View Your Order</a></p>
      `;
    } else if (status === 'return_approved') {
      subject = 'Return Approved - Your Refund is Being Processed!';
      htmlContent = `
        <h2>Your Return Has Been Approved! ✓</h2>
        <p>Hi ${userEmail},</p>
        <p>Great news! Your return request for order #${orderData._id} has been approved by our admin team.</p>
        <p><strong>Refund Amount:</strong> ₹${orderData.refund.amount.toFixed(2)}</p>
        <p><strong>Refund Status:</strong> Processing</p>
        ${orderData.paymentMethod === 'cod' ? `
          <p><strong>Next Steps (COD Order):</strong></p>
          <ul>
            <li>Our team will contact you to arrange item pickup</li>
            <li>Once item is received and verified, you'll get a manual refund via cash/UPI/bank transfer</li>
            <li>Expected timeline: 3-5 business days</li>
          </ul>
        ` : `
          <p><strong>Next Steps (Online Payment):</strong></p>
          <ul>
            <li>We have processed your refund through Razorpay</li>
            <li>Funds will appear in your account within 5-7 business days</li>
            <li>No need to return the item (our team will arrange pickup)</li>
          </ul>
        `}
        <p>Thank you for your understanding!</p>
        <p><a href="${trackingLink}">View Your Order</a></p>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail} for order status: ${status}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - continue even if email fails
  }
};

module.exports = { sendOrderEmail };
