const axios = require('axios');

// Razorpay API base URL
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

// Get Razorpay credentials from environment
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Create basic auth header for Razorpay API
const getBasicAuthHeader = () => {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

/**
 * Capture an authorized payment in Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to capture in rupees
 * @returns {Promise<Object>} - Capture response from Razorpay
 */
const capturePayment = async (paymentId, amount) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured in environment');
    }

    const captureUrl = `${RAZORPAY_API_URL}/payments/${paymentId}/capture`;
    
    const captureData = {
      amount: Math.round(amount * 100) // Convert rupees to paise
    };

    const response = await axios.post(captureUrl, captureData, {
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    console.log(`Payment captured successfully for ${paymentId}:`, response.data);
    return {
      success: true,
      paymentId: response.data.id,
      status: response.data.status,
      data: response.data
    };
  } catch (error) {
    console.error('Error capturing payment:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.description || error.message,
      data: error.response?.data
    };
  }
};

/**
 * Process refund for a Razorpay payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in paise (optional, if not provided, full refund)
 * @param {string} notes - Refund notes/reason
 * @returns {Promise<Object>} - Refund response from Razorpay
 */
const processRazorpayRefund = async (paymentId, amount = null, notes = '') => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured in environment');
    }

    const refundUrl = `${RAZORPAY_API_URL}/payments/${paymentId}/refund`;
    
    const refundData = {
      notes: {
        reason: notes || 'Order cancelled by user'
      }
    };

    // If amount is provided, convert to paise and add to request
    if (amount && amount > 0) {
      refundData.amount = Math.round(amount * 100); // Convert rupees to paise
    }

    const response = await axios.post(refundUrl, refundData, {
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    console.log(`Refund processed successfully for payment ${paymentId}:`, response.data);
    return {
      success: true,
      refundId: response.data.id,
      data: response.data
    };
  } catch (error) {
    console.error('Error processing Razorpay refund:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.description || error.message,
      data: error.response?.data
    };
  }
};

/**
 * Get refund status from Razorpay
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<Object>} - Refund status response
 */
const getRefundStatus = async (refundId) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const url = `${RAZORPAY_API_URL}/refunds/${refundId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching refund status:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.description || error.message
    };
  }
};

/**
 * Validate if a payment can be refunded
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - {canRefund: boolean, reason: string, details: object}
 */
const canRefundPayment = async (paymentId) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return {
        canRefund: false,
        reason: 'Razorpay credentials not configured in environment'
      };
    }

    const url = `${RAZORPAY_API_URL}/payments/${paymentId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    // Payment must be captured and not expired for refund
    const payment = response.data;
    console.log(`Payment details for ${paymentId}:`, {
      status: payment.status,
      expired: payment.expired,
      amount: payment.amount,
      method: payment.method
    });

    if (payment.status !== 'captured') {
      return {
        canRefund: false,
        reason: `Payment status is '${payment.status}', not 'captured'. Only captured payments can be refunded.`,
        details: payment
      };
    }

    if (payment.expired) {
      return {
        canRefund: false,
        reason: 'Payment has expired and cannot be refunded anymore',
        details: payment
      };
    }

    return {
      canRefund: true,
      reason: 'Payment is eligible for refund',
      details: payment
    };
  } catch (error) {
    console.error('Error checking payment refund eligibility:', error.response?.data || error.message);
    return {
      canRefund: false,
      reason: error.response?.data?.error?.description || `Failed to check payment status: ${error.message}`,
      error: error.response?.data
    };
  }
};

module.exports = {
  capturePayment,
  processRazorpayRefund,
  getRefundStatus,
  canRefundPayment
};
