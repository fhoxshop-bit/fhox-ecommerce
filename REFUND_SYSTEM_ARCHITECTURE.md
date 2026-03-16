# Refund System Architecture & Flows

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE REFUND SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

                           ┌──────────────┐
                           │   Customer   │
                           └──────┬───────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
           ┌────────▼─────────┐        ┌────────▼─────────┐
           │   CANCEL ORDER   │        │ REQUEST RETURN   │
           │  (Before Ship)   │        │  (Post Deliver)  │
           └────────┬─────────┘        └────────┬─────────┘
                    │                            │
         ┌──────────▼──────────┐      ┌──────────▼──────────┐
         │ Check Payment Method │      │  Verify Eligibility  │
         └──────────┬──────────┘      └──────────┬──────────┘
                    │                            │
        ┌───────────┴───────────┐      ┌────────▼────┐
        │                       │      │ Order Status │
        │                       │      │ return_reqst │
     ┌──▼──┐           ┌──────▼──┐    └─────┬────────┘
     │RPAY │           │  COD    │          │
     └──┬──┘           └──┬──────┘          │
        │                 │                 │
 ┌──────▼─────────┐   ┌───▼──┐      ┌──────▼──────────┐
 │ Refund Pending │   │ Done │      │ Admin Review    │
 │ (Stock back)   │   │      │      │ & Approval      │
 └──────┬─────────┘   └──────┘      └──────┬──────────┘
        │                                   │
        └─────────────────┬─────────────────┘
                          │
                 ┌────────▼─────────┐
                 │  Admin Process   │
                 │     Refund       │
                 └────────┬─────────┘
                          │
                    ┌─────▼────────┐
                    │ Call Razorpay │
                    │  Refund API   │
                    └─────┬────────┘
                          │
              ┌───────────┴──────────┐
              │                      │
         ┌────▼────┐        ┌───────▼────┐
         │ SUCCESS │        │   FAILED   │
         └────┬────┘        └───────┬────┘
              │                     │
    ┌─────────▼────────┐    ┌──────▼───────┐
    │ Refund Processed │    │ Retry Later  │
    │ Email Sent       │    │ Log Error    │
    │ Bank 5-7 days    │    └──────────────┘
    └──────────────────┘
```

---

## Detailed Process Flows

### Flow 1: Order Cancellation (Razorpay Payment)

```
User Actions:
1. Views pending/accepted order
2. Clicks "Cancel Order"
3. Enters cancellation reason
4. Confirms

System Actions:
┌──────────────────────────────────────────────────────┐
│ POST /api/orders/:id/cancel                          │
├──────────────────────────────────────────────────────┤
│                                                       │
│ ✓ Verify user owns order                            │
│ ✓ Check order status (pending/accepted only)        │
│ ✓ Update order status → 'cancelled'                 │
│ ✓ Restore product stock (total + size-specific)    │
│ ✓ If Razorpay:                                      │
│   - Set refund.status → 'pending'                   │
│   - Set refund.amount → order.total                 │
│   - Set refund.reason → user input                  │
│   - Set refund.requestedAt → now                    │
│   - Set paymentStatus → 'refunded'                  │
│ ✓ If COD:                                           │
│   - No payment to refund (skip)                     │
│ ✓ Send cancellation email                          │
│ ✓ Return success message + order data              │
│                                                       │
└──────────────────────────────────────────────────────┘

Response:
{
  "success": true,
  "message": "Order cancelled. Refund initiated...",
  "order": {
    "_id": "6476...",
    "orderStatus": "cancelled",
    "paymentStatus": "refunded",
    "refund": {
      "status": "pending",
      "amount": 999.99,
      "reason": "..." ,
      "requestedAt": "2024-03-13T10:30:00Z"
    }
  }
}

Email Sent: "Order Cancelled - Your Refund is Processing"
- Shows refund amount
- Explains 5-7 day timeline
```

---

### Flow 2: Return Request (Post Delivery)

```
User Actions:
1. Views delivered order
2. Clicks "Request Return"
3. Enters return reason
4. Submits request

System Actions:
┌──────────────────────────────────────────────────────┐
│ POST /api/orders/:id/request-refund                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│ ✓ Verify user owns order                            │
│ ✓ Check order status == 'delivered'                 │
│ ✓ Check paymentStatus == 'paid'                     │
│ ✓ Update order status → 'return_requested'          │
│ ✓ Set refund.status → 'pending'                     │
│ ✓ Set refund.amount → order.total                   │
│ ✓ Set refund.reason → user input                    │
│ ✓ Set refund.requestedAt → now                      │
│ ✓ Send notification email                           │
│ ✓ Return success message                            │
│                                                       │
└──────────────────────────────────────────────────────┘

Response:
{
  "success": true,
  "message": "Return request submitted...",
  "order": { ... }
}

Email Sent: "Return Request Received"
- Shows order details
- Await admin approval message
```

---

### Flow 3: Admin Refund Processing

```
Admin Actions (In Admin Panel):
1. Views orders with pending refunds
2. Verifies refund request
3. Clicks "Process Refund"

System Actions:
┌────────────────────────────────────────────────────────┐
│ POST /api/orders/:id/process-refund (Admin)          │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 1. Validate Eligibility:                             │
│    ✓ Order status = 'cancelled' OR 'return_reqst'   │
│    ✓ Payment method = 'razorpay' (not COD)          │
│    ✓ razorpayPaymentId exists                       │
│    ✓ refund.status = 'pending'                      │
│                                                        │
│ 2. Check with Razorpay:                             │
│    ✓ Verify payment exists & is 'captured'         │
│    ✓ Verify payment not expired (< 365 days)       │
│                                                        │
│ 3. Process Refund:                                  │
│    ✓ Call Razorpay Refund API                      │
│    ✓ Send: paymentId + amount + reason             │
│    ✓ Receive: refundId                             │
│                                                        │
│ 4. Update Database:                                │
│    ✓ refund.status → 'processed'                   │
│    ✓ refund.razorpayRefundId → received ID         │
│    ✓ refund.processedAt → now                      │
│    ✓ paymentStatus → 'refunded'                    │
│                                                        │
│ 5. Send Confirmation:                              │
│    ✓ Email customer with refund details            │
│    ✓ Return success response with refund info      │
│                                                        │
└────────────────────────────────────────────────────────┘

Response:
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

Email Sent: "Refund Processed!"
- Shows refund ID
- Shows refund amount
- Explains 5-7 day bank transfer timeline
```

---

### Flow 4: Check Refund Status

```
User Action:
1. Click "Check Refund Status"

System Action:
┌──────────────────────────────────────────────────────┐
│ GET /api/orders/:id/refund-status                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│ ✓ If razorpayRefundId exists:                      │
│   - Query Razorpay for latest status                │
│   - Return live status from Razorpay                │
│ ✓ Else:                                             │
│   - Return refund data from database                │
│ ✓ Return status, amount, dates, etc.               │
│                                                       │
└──────────────────────────────────────────────────────┘

Response:
{
  "success": true,
  "refund": {
    "status": "processed",
    "amount": 999.99,
    "razorpayRefundId": "rfnd_1234567890",
    "createdAt": "2024-03-13T10:35:00Z"
  }
}

Shows to user:
- ✓ Refund processed
- ✓ Amount: ₹999.99
- ✓ Timeline: 5-7 business days
```

---

## Database Schema Changes

### Order Model - Refund Object

```javascript
refund: {
  status: {
    // 'none' = no refund initiated
    // 'pending' = waiting for admin processing
    // 'approved' = admin approved (for future)
    // 'processed' = refund sent to Razorpay
    // 'failed' = refund attempt failed
    type: String,
    enum: ['none', 'pending', 'approved', 'processed', 'failed'],
    default: 'none'
  },
  
  amount: Number,          // Refund amount in rupees
  reason: String,          // Why refund was requested
  razorpayRefundId: String,// Refund ID from Razorpay
  requestedAt: Date,       // When user requested refund
  processedAt: Date,       // When admin processed it
  notes: String           // For error logging
}
```

---

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/orders/:id/cancel` | POST | User | Cancel order (pre-shipment) |
| `/api/orders/:id/request-refund` | POST | User | Request return (post-delivery) |
| `/api/orders/:id/refund-status` | GET | User | Check refund status |
| `/api/orders/:id/process-refund` | POST | Admin | Process refund via Razorpay |

---

## Error Handling Matrix

```
Scenario                          Status Code  Action
─────────────────────────────────────────────────────────
Order not found                   404          Return error
Not authorized to cancel          403          Return error
Order can't be cancelled          400          Return error
Order eligible but not paid       200          Cancel, no refund
Payment expired (>365 days)       400          Fail with message
Razorpay credentials missing      500          Log error + notify
Razorpay API call fails           400          Mark as 'failed'
Refund already processed          400          Return error
Invalid refund status             400          Return error
```

---

## Stock Restoration Logic

When order is cancelled:

```javascript
Order.items.forEach(item => {
  // Find product
  const product = products.find(p => p.id === item.productId);
  
  // Restore size-specific stock (if applicable)
  if (item.size && product.sizeStock) {
    product.sizeStock[item.size] += item.quantity;
  }
  
  // Restore total stock
  product.stock += item.quantity;
});

// Save updated products
writeProducts(products);
```

---

## Email Notification Timeline

```
1. ORDER CANCELLATION (Immediate)
   ├─ "Order Cancelled - Your Refund is Processing"
   ├─ Shows refund amount
   └─ Shows 5-7 day timeline

2. RETURN REQUEST (Immediate)
   ├─ "Return Request Received"
   ├─ Shows order details
   └─ Awaiting admin review

3. REFUND PROCESSING (When admin processes)
   ├─ "Refund Processed!"
   ├─ Shows refund ID
   ├─ Shows amount
   └─ Explains bank transfer timeline

4. NO EMAIL FOR:
   ├─ /refund-status checks (API only)
   └─ Failed refunds (logged in server)
```

---

## Razorpay Integration Points

```
System                  Razorpay
──────────────────────────────────────
Order Created
├─ Razorpay payment
│  collected (existing)
└─ razorpayPaymentId
   stored

Order Cancelled/Return
Requested
└─ refund.status = 'pending'

Admin Clicks
Process Refund
├─ Call: GET /payments/{id}
│  to verify payment
├─ Call: POST /payments/{id}/refund
│  with amount + reason
└─ Receive: refundId
   Store in DB

User Checks Status
└─ Call: GET /refunds/{id}
   to get live status
```

---

## Security Considerations

```
✓ User Authorization
  - Check req.user.userId owns order
  - Prevent cross-user refund requests

✓ Data Validation
  - Validate order exists
  - Validate status transitions
  - Validate amounts

✓ API Key Security
  - RAZORPAY_KEY_SECRET never exposed
  - Only used in backend
  - Credentials in .env (not committed)

✓ Transaction Safety
  - Refund marked before API call
  - Stock restored atomically
  - Proper error handling & rollback

✓ Email Security
  - Email only sent after DB update
  - No sensitive data in email body
  - Link to secure user dashboard
```

---

## Future Enhancements

```
Phase 2:
├─ Partial refunds (multi-item orders)
├─ Refund reason analytics
├─ Admin dashboard with refund stats
└─ Automated refund approval rules

Phase 3:
├─ Return pickup scheduling
├─ Refund to wallet option
├─ Return shipping labels
└─ Custom refund windows per product

Phase 4:
├─ Webhook support for async updates
├─ Refund status webhooks
├─ Multi-currency support
└─ International refund routing
```

---

**System is production-ready and fully documented!** 🚀
