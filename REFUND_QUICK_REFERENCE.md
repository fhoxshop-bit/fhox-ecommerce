# Refund System - Quick Reference & Code Examples

## Quick Setup Checklist (2 minutes)

```bash
# 1. Install axios
cd backend
npm install axios

# 2. Update .env file with:
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret

# 3. Restart server
npm run dev
```

Done! ✅

---

## API Quick Reference

### 1️⃣ Cancel Order (User)
```
POST /api/orders/{orderId}/cancel
Authorization: Bearer {userToken}

Body: { "reason": "string" }

Response: { 
  success: true,
  order: { orderStatus: 'cancelled', refund: {...} }
}
```

### 2️⃣ Request Return (User)
```
POST /api/orders/{orderId}/request-refund
Authorization: Bearer {userToken}

Body: { "reason": "string" }

Response: { 
  success: true,
  message: "Return request submitted..."
}
```

### 3️⃣ Check Refund Status (User)
```
GET /api/orders/{orderId}/refund-status
Authorization: Bearer {userToken}

Response: {
  success: true,
  refund: {
    status: 'processed',
    amount: 999.99,
    razorpayRefundId: 'rfnd_...'
  }
}
```

### 4️⃣ Process Refund (Admin)
```
POST /api/orders/{orderId}/process-refund
Authorization: Bearer {adminToken}

Response: {
  success: true,
  refund: {
    refundId: 'rfnd_...',
    amount: 999.99,
    status: 'processed'
  }
}
```

---

## Frontend Components

### React - Cancel Order Button

```jsx
import { useState } from 'react';

export function CancelOrderButton({ orderId, token, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    const reason = prompt('Why do you want to cancel?');
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert('Error: ' + (data.message || 'Failed to cancel'));
        return;
      }

      alert('✅ Order cancelled successfully!\nRefund will process in 5-7 days.');
      onSuccess?.();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCancel} 
      disabled={loading}
      style={{
        padding: '10px 20px',
        backgroundColor: '#ff6b6b',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? 'Cancelling...' : 'Cancel Order'}
    </button>
  );
}
```

**Usage:**
```jsx
<CancelOrderButton 
  orderId="6476abc123..." 
  token={userToken} 
  onSuccess={() => refreshOrders()}
/>
```

---

### React - Return Request Modal

```jsx
import { useState } from 'react';

export function ReturnRequestModal({ orderId, token, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/orders/${orderId}/request-refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to request return');
      }

      alert('✅ Return request submitted!\nAdmin will review and process within 3-5 days.');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2>Request Return</h2>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you want to return this order..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
          />

          {error && (
            <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Usage:**
```jsx
const [showReturnModal, setShowReturnModal] = useState(false);

return (
  <>
    <button onClick={() => setShowReturnModal(true)}>Request Return</button>
    
    {showReturnModal && (
      <ReturnRequestModal
        orderId={order._id}
        token={token}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => refreshOrders()}
      />
    )}
  </>
);
```

---

### React - Refund Status Tracker

```jsx
import { useState, useEffect } from 'react';

export function RefundStatusTracker({ orderId, token }) {
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefundStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRefundStatus, 30000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  const fetchRefundStatus = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/refund-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRefund(data.refund);
      }
    } catch (error) {
      console.error('Failed to fetch refund status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading refund status...</p>;
  }

  if (!refund || refund.status === 'none') {
    return <p>No refund for this order</p>;
  }

  const statusColors = {
    pending: '#ffc107',
    processed: '#28a745',
    failed: '#dc3545'
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Refund Status</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong>
        <span style={{
          marginLeft: '10px',
          padding: '4px 12px',
          backgroundColor: statusColors[refund.status] || '#6c757d',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {refund.status.toUpperCase()}
        </span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Amount:</strong> ₹{refund.amount?.toFixed(2)}
      </div>

      {refund.razorpayRefundId && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Refund ID:</strong> {refund.razorpayRefundId}
        </div>
      )}

      {refund.processedAt && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Processed:</strong> {new Date(refund.processedAt).toLocaleDateString()}
        </div>
      )}

      {refund.status === 'processed' && (
        <p style={{ 
          marginTop: '10px',
          fontSize: '12px',
          color: '#666'
        }}>
          ℹ️ The refund amount will appear in your account within 5-7 business days.
        </p>
      )}

      {refund.status === 'pending' && (
        <p style={{ 
          marginTop: '10px',
          fontSize: '12px',
          color: '#666'
        }}>
          ℹ️ Your refund request is waiting for admin approval.
        </p>
      )}
    </div>
  );
}
```

**Usage:**
```jsx
<RefundStatusTracker orderId={order._id} token={token} />
```

---

### Admin - Refund Processing

```jsx
import { useState } from 'react';

export function AdminRefundProcessor({ orderId, token, order, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleProcessRefund = async () => {
    const confirmed = window.confirm(
      `Process refund of ₹${order.total.toFixed(2)}?\n\nRefund ID: ${order.razorpayPaymentId}`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/process-refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert('❌ Error: ' + (data.error || data.message || 'Failed'));
        return;
      }

      alert(`✅ Refund processed successfully!\nRefund ID: ${data.refund.refundId}`);
      onSuccess?.();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isEligible = order.refund?.status === 'pending' && 
                     order.paymentMethod === 'razorpay';

  return (
    <div style={{
      border: '2px solid #ffc107',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#fff8dc'
    }}>
      <h3>⚠️ Pending Refund</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Amount:</strong> ₹{order.refund?.amount?.toFixed(2)}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Reason:</strong> {order.refund?.reason}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Requested:</strong> {new Date(order.refund?.requestedAt).toLocaleString()}
      </div>

      <button
        onClick={handleProcessRefund}
        disabled={loading || !isEligible}
        style={{
          padding: '10px 20px',
          backgroundColor: isEligible ? '#28a745' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isEligible && !loading ? 'pointer' : 'not-allowed',
          fontWeight: 'bold'
        }}
      >
        {loading ? '⏳ Processing...' : '✓ Process Refund'}
      </button>

      {!isEligible && (
        <p style={{ 
          marginTop: '10px',
          color: '#666',
          fontSize: '14px'
        }}>
          Only Razorpay refunds can be processed here.
        </p>
      )}
    </div>
  );
}
```

**Usage:**
```jsx
{order.refund?.status === 'pending' && (
  <AdminRefundProcessor 
    orderId={order._id}
    token={adminToken}
    order={order}
    onSuccess={() => refreshOrders()}
  />
)}
```

---

## Integration Checklist

- [ ] Install axios: `npm install axios`
- [ ] Add Razorpay credentials to `.env`
- [ ] Restart backend server
- [ ] Test cancel endpoint with Razorpay order
- [ ] Test return request with delivered order
- [ ] Test admin refund processing
- [ ] Verify emails are sent
- [ ] Check Razorpay dashboard for refund entries
- [ ] Add Cancel button to order detail page
- [ ] Add Return Request button to delivered orders
- [ ] Add Refund Status display to order tracking
- [ ] Add Refund Processor to admin panel

---

## Common Errors & Fixes

### ❌ "Razorpay credentials not configured"
```
✅ Fix: Add to .env file:
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   Then restart server: npm run dev
```

### ❌ "axios is not defined"
```
✅ Fix: Install axios:
   npm install axios
   Then restart server
```

### ❌ "Cannot cancel order at this stage"
```
✅ Fix: Order must be 'pending' or 'accepted'
   Not allowed for: shipped, delivered, or already cancelled
```

### ❌ "Payment not found"
```
✅ Fix: Verify razorpayPaymentId in order document
   Check order was created with Razorpay payment
```

### ❌ "Only Razorpay payments can be refunded"
```
✅ Fix: This is correct - COD orders have no payment to refund
   COD orders can only be cancelled (no refund processing)
```

---

## Testing API Calls (Postman/cURL)

### Test 1: Create & Cancel Razorpay Order

```bash
# 1. Create order first (existing endpoint)
POST http://localhost:5000/api/orders
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{
  "items": [
    {
      "id": "1",
      "name": "Product Name",
      "price": 999.99,
      "quantity": 1
    }
  ],
  "address": {...},
  "paymentMethod": "razorpay",
  "razorpayPaymentId": "pay_1234567890"
}

# Response: order._id from this response

# 2. Cancel the order
POST http://localhost:5000/api/orders/{ORDER_ID}/cancel
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{
  "reason": "Test cancellation"
}
```

### Test 2: Process Refund (Admin)

```bash
POST http://localhost:5000/api/orders/{ORDER_ID}/process-refund
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

### Test 3: Get Refund Status

```bash
GET http://localhost:5000/api/orders/{ORDER_ID}/refund-status
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/models/Order.js` | Order schema with refund fields |
| `backend/utils/razorpayService.js` | Razorpay API integration |
| `backend/controllers/orderController.js` | Refund logic (4 new functions) |
| `backend/routes/orders.js` | New refund API endpoints |
| `backend/utils/orderEmailService.js` | Refund email templates |
| `REFUND_SYSTEM_GUIDE.md` | Complete system documentation |
| `REFUND_SETUP_GUIDE.md` | Setup & installation steps |
| `REFUND_SYSTEM_ARCHITECTURE.md` | Detailed flows & diagrams |

---

✅ **You're all set!** Implement the components above and make sure to test thoroughly.
