# Refund System Setup Instructions

## ✅ What Was Implemented

A **complete, production-ready refund system** with automatic Razorpay payment refunds and return request handling.

### Files Modified:
1. **Model:** `backend/models/Order.js` - Added refund tracking object
2. **Controller:** `backend/controllers/orderController.js` - Added 4 new refund functions
3. **Routes:** `backend/routes/orders.js` - Added 3 new refund endpoints
4. **Email Service:** `backend/utils/orderEmailService.js` - Added refund notification templates
5. **Package.json:** `backend/package.json` - Added axios dependency

### Files Created:
1. **Razorpay Service:** `backend/utils/razorpayService.js` - Handles Razorpay API integration
2. **Documentation:** `REFUND_SYSTEM_GUIDE.md` - Complete implementation guide

---

## 🚀 Installation & Setup Steps

### Step 1: Install Dependencies
Run this command in your backend directory:

```bash
cd backend
npm install axios
```

This installs the axios package needed for Razorpay API calls.

---

### Step 2: Configure Environment Variables

Update your `.env` file in the backend directory:

```env
# Existing variables (keep these)
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# NEW - Add Razorpay Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**How to Get Razorpay Credentials:**
1. Go to https://dashboard.razorpay.com
2. Login to your account
3. Go to Settings → API Keys
4. Copy your Key ID and Key Secret
5. For testing: Use test credentials first
6. For production: Switch to live credentials

---

### Step 3: Restart Backend Server

```bash
# Stop the running server (Ctrl+C)
# Then restart with:
node server.js
```

Or if using nodemon:
```bash
npm run dev
```

---

## 🧪 Testing the System

### Test 1: Cancel an Order (Razorpay)

**Using cURL or Postman:**

```bash
POST http://localhost:5000/api/orders/ORDER_ID/cancel
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "reason": "Changed my mind about this product"
}
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "orderStatus": "cancelled",
    "paymentStatus": "refunded",
    "refund": {
      "status": "pending",
      "amount": 999.99,
      "reason": "Changed my mind about this product",
      "requestedAt": "2024-03-13T10:30:00.000Z"
    }
  },
  "message": "Order cancelled. Refund initiated and will be processed within 5-7 business days."
}
```

---

### Test 2: Process Refund (Admin)

**Using cURL or Postman:**

```bash
POST http://localhost:5000/api/orders/ORDER_ID/process-refund
Headers:
  Authorization: Bearer ADMIN_JWT_TOKEN
  Content-Type: application/json
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "refund": {
    "refundId": "rfnd_1234567890",
    "amount": 999.99,
    "status": "processed",
    "processedAt": "2024-03-13T10:35:00Z"
  }
}
```

---

### Test 3: Request Return for Delivered Order

**Using cURL or Postman:**

```bash
POST http://localhost:5000/api/orders/ORDER_ID/request-refund
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "reason": "Product arrived damaged"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Return request submitted. Admin will review and process your refund.",
  "order": { ... }
}
```

---

### Test 4: Check Refund Status

**Using cURL or Postman:**

```bash
GET http://localhost:5000/api/orders/ORDER_ID/refund-status
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "refund": {
    "status": "processed",
    "amount": 999.99,
    "razorpayRefundId": "rfnd_1234567890",
    "createdAt": "2024-03-13T10:35:00Z"
  }
}
```

---

## 📱 Frontend Integration Examples

### React Component Example - Cancel Order

```jsx
import { useState } from 'react';

export function CancelOrderButton({ orderId, token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Customer requested cancellation'
        })
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      const data = await response.json();
      alert(data.message);
      // Refresh order list or navigate
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCancel} disabled={loading}>
      {loading ? 'Processing...' : 'Cancel Order'}
    </button>
  );
}
```

### React Component Example - Request Return

```jsx
import { useState } from 'react';

export function RequestReturnModal({ orderId, token, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/request-refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Failed to request return');

      const data = await response.json();
      alert(data.message);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why do you want to return this order?"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Return Request'}
      </button>
    </form>
  );
}
```

### React Component Example - Admin Refund Processing

```jsx
import { useState } from 'react';

export function AdminRefundButton({ orderId, token, order }) {
  const [loading, setLoading] = useState(false);

  const handleProcessRefund = async () => {
    if (!window.confirm('Process refund for ₹' + order.total + '?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/process-refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert(`Refund processed! ID: ${data.refund.refundId}`);
      // Refresh order details
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleProcessRefund} 
      disabled={loading || order.refund.status !== 'pending'}
    >
      {loading ? 'Processing...' : 'Process Refund'}
    </button>
  );
}
```

---

## 🔍 Verification Checklist

After setup, verify the following:

- [ ] Backend server starts without errors
- [ ] axios is installed in `node_modules`
- [ ] `.env` file has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [ ] New routes appear in server logs
- [ ] Can create order with Razorpay payment
- [ ] Cancel order works → returns refund status: 'pending'
- [ ] Admin can process refund
- [ ] Razorpay refund API is called successfully
- [ ] User receives refund confirmation email
- [ ] Check Razorpay dashboard shows refund entry
- [ ] Stock is restored when order is cancelled

---

## ⚠️ Important Notes

### Production Considerations:
1. **Use Live Credentials:** Switch from test to live Razorpay credentials before going production
2. **HTTPS Only:** Razorpay requires HTTPS in production
3. **Webhook Support:** Consider implementing Razorpay webhooks for async refund status updates
4. **Rate Limiting:** Add rate limiting to refund endpoints to prevent abuse
5. **Audit Logging:** Log all refund transactions for compliance

### Testing with Razorpay Test Mode:
- Razorpay provides test payment methods
- Test refunds appear in test dashboard
- Switch to live mode credentials when ready

### Common Issues & Solutions:

**Issue: "Razorpay credentials not configured"**
- Solution: Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file

**Issue: Refund returns "Payment not found"**
- Solution: Verify the razorpayPaymentId is correct in the order document

**Issue: "This payment cannot be refunded"**
- Solution: Check if payment is older than 365 days (Razorpay limit)

---

## 📊 Monitoring Refunds

### Check Refund Status in Razorpay Dashboard:
1. Log into https://dashboard.razorpay.com
2. Go to Refunds section
3. Search by refund ID or payment ID
4. Monitor refund status: `processed`, `failed`, `pending`

### Monitor in Your Application:
```javascript
// Check refund status programmatically
const response = await fetch(`/api/orders/${orderId}/refund-status`);
const { refund } = await response.json();
console.log('Refund Status:', refund.status);
console.log('Amount:', refund.amount);
console.log('Processed At:', refund.processedAt);
```

---

## 📚 Additional Resources

- **Full Guide:** See `REFUND_SYSTEM_GUIDE.md`
- **Razorpay Docs:** https://razorpay.com/docs/
- **Razorpay Refund API:** https://razorpay.com/docs/api/refunds/
- **Testing Payment Methods:** https://razorpay.com/docs/payments/payments-guide-web/test-payment-methods/

---

## ✨ Summary

Your refund system is now ready to:
- ✅ Automatically handle order cancellations
- ✅ Process Razorpay refunds on demand
- ✅ Handle return requests for delivered items
- ✅ Send email notifications at each stage
- ✅ Restore product stock on cancellation
- ✅ Track refund status in real-time

**The system is production-ready with proper error handling, validation, and user notifications!**
