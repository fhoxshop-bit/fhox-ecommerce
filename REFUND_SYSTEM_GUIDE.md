# Refund System Implementation Guide

## Overview
A complete refund system has been implemented to handle order cancellations and returns with automatic Razorpay refund processing.

## System Architecture

### 1. **Refund Flow**

```
User Cancels Order (Before Shipment)
         ↓
System checks payment method
         ↓
If Razorpay:
  - Mark order as 'cancelled'
  - Set refund status to 'pending'
  - Admin calls /process-refund endpoint
  - Razorpay processes actual refund
  - Email confirmation sent
         ↓
If COD:
  - Mark order as 'cancelled'
  - No payment to refund
```

```
User Returns Delivered Order
         ↓
User calls /request-refund endpoint
         ↓
System marks order status as 'return_requested'
         ↓
Admin reviews and calls /process-refund endpoint
         ↓
Razorpay refund processed
         ↓
User receives refund confirmation email
```

### 2. **Order Model Updates**

Added refund tracking object to Order schema:

```javascript
refund: {
  status: { enum: ['none', 'pending', 'approved', 'processed', 'failed'] },
  amount: Number,
  reason: String,
  razorpayRefundId: String,
  requestedAt: Date,
  processedAt: Date,
  notes: String
}
```

### 3. **Payment Status Enums**

Extended payment status options:
- `pending` - Payment not yet made
- `paid` - Payment received
- `refunded` - Full refund processed
- `partial_refund` - Partial refund processed (for future use)

### 4. **Order Status Enums**

Added new order status:
- `return_requested` - Customer has requested return/refund

## API Endpoints

### Cancel Order (User)
**Endpoint:** `POST /api/orders/:id/cancel`

**Authentication:** Required (user token)

**Request Body:**
```json
{
  "reason": "Changed my mind about the product"
}
```

**Response:**
```json
{
  "success": true,
  "order": { ... },
  "message": "Order cancelled. Refund initiated and will be processed within 5-7 business days."
}
```

**Eligibility:**
- Order must be in 'pending' or 'accepted' status
- NOT allowed for shipped/delivered orders

**What Happens:**
- Order status → 'cancelled'
- Product stock is restored
- For Razorpay: Refund marked as 'pending' for admin processing
- For COD: No refund needed
- Cancellation email sent

---

### Request Refund/Return (User)
**Endpoint:** `POST /api/orders/:id/request-refund`

**Authentication:** Required (user token)

**Request Body:**
```json
{
  "reason": "Product damaged during delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Return request submitted. Admin will review and process your refund.",
  "order": { ... }
}
```

**Eligibility:**
- Order must be in 'delivered' status
- Payment status must be 'paid'

**What Happens:**
- Order status → 'return_requested'
- Refund marked as 'pending'
- Refund amount = full order total
- Admin receives notification

---

### Process Refund (Admin)
**Endpoint:** `POST /api/orders/:id/process-refund`

**Authentication:** Required (admin token)

**Request Body:** (None - uses refund data from order)

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "refund": {
    "refundId": "rfnd_1234567890",
    "amount": 999.99,
    "status": "processed",
    "processedAt": "2024-03-13T10:30:00Z"
  }
}
```

**Eligibility:**
- Order must be 'cancelled' or 'return_requested'
- Must be Razorpay payment (not COD)
- Payment must not be expired/invalid

**What Happens:**
1. Validates payment with Razorpay
2. Calls Razorpay refund API
3. Stores refund ID and timestamp
4. Updates payment status to 'refunded'
5. Sends refund confirmation email

---

### Get Refund Status (User)
**Endpoint:** `GET /api/orders/:id/refund-status`

**Authentication:** Required (user token)

**Response:**
```json
{
  "success": true,
  "refund": {
    "status": "processed",
    "amount": 999.99,
    "razorpayRefundId": "rfnd_1234567890",
    "createdAt": "2024-03-13T10:30:00Z"
  }
}
```

## Environment Variables Required

Add these to your `.env` file:

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Refund Processing Steps

### Step 1: Customer Initiates Action
- **Option A:** User cancels order before shipment → Auto-marked for refund
- **Option B:** User requests return for delivered order → Marked pending admin review

### Step 2: Admin Reviews & Processes
1. Admin logs into admin panel
2. Finds order with pending refund
3. Clicks "Process Refund" button
4. System:
   - Validates Razorpay payment is refundable
   - Calls Razorpay refund API with order total
   - Stores refund transaction ID
   - Sends confirmation to customer email

### Step 3: Refund Timeline
- **Razorpay Processing:** Instant (status updated immediately)
- **Bank Transfer:** 5-7 business days (varies by bank)

## Error Handling

### Refund Failures
If refund processing fails, the system:
1. Sets refund status to 'failed'
2. Stores error message in refund notes
3. Does NOT update payment status
4. Allows retry with `POST /api/orders/:id/process-refund`

### Non-Refundable Orders
Cannot process refunds for:
- COD orders (no payment to refund)
- Orders that weren't paid
- Payments older than refund window (if configured)
- Orders in invalid status

## Email Notifications

### Email Templates Added/Updated

1. **Order Cancelled** (status: 'cancelled')
   - Sent when user cancels order
   - Shows refund amount and timeline

2. **Return Requested** (status: 'return_requested')
   - Sent when user requests return
   - Awaiting admin approval message

3. **Refund Processed** (status: 'refunded')
   - Sent when admin processes refund
   - Shows refund ID and timeline
   - Confirms how long until bank transfer

## Frontend Integration

### User Side - Order Cancellation
```javascript
// Cancel pending order
await fetch(`/api/orders/${orderId}/cancel`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ reason: 'Changed my mind' })
});
```

### User Side - Return Request
```javascript
// Request return for delivered order
await fetch(`/api/orders/${orderId}/request-refund`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ reason: 'Product damaged' })
});
```

### User Side - Check Refund Status
```javascript
// Check refund status
const response = await fetch(`/api/orders/${orderId}/refund-status`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { refund } = await response.json();
```

### Admin Side - Process Refund
```javascript
// Admin processes refund
await fetch(`/api/orders/${orderId}/process-refund`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

## Testing Guide

### Test Case 1: Cancel Razorpay Order
1. Create order with Razorpay payment
2. Before shipment, cancel order
3. Verify refund status = 'pending'
4. As admin, process refund
5. Verify refund processed successfully
6. Check confirmation email received

### Test Case 2: Return Delivered Order
1. Create order and mark as delivered
2. User requests refund
3. Order status → 'return_requested'
4. Admin processes refund
5. Verify confirmation email with refund ID

### Test Case 3: COD Order Cancellation
1. Create COD order
2. Cancel it
3. Verify no refund processing needed
4. Stock should be restored

## Future Enhancements

1. **Partial Refunds** - Refund specific items from multi-item orders
2. **Refund Reasons Analytics** - Track why customers are requesting returns
3. **Return Pickup** - Integrate with logistics for pickup scheduling
4. **Automated Refunds** - Auto-process based on time/conditions
5. **Refund Rate Dashboard** - Admin analytics on refund trends
6. **Payment Method Routing** - Refund to wallet for quick returns
7. **Multi-Currency Support** - Handle international transactions

## Important Notes

⚠️ **Razorpay API Credentials:**
- Keep `RAZORPAY_KEY_SECRET` secure in `.env` file
- Never commit `.env` to version control
- Use test credentials in development

⚠️ **Testing Razorpay:**
- Use test payment method first
- Switch to live credentials in production
- Monitor Razorpay dashboard for refund status

⚠️ **Database:**
- Ensure MongoDB is running
- Order model includes new refund schema
- Old orders won't have refund field (handled gracefully)

⚠️ **Stock Management:**
- Stock is restored when order is cancelled
- Make sure frontend reflects updated availability

## Troubleshooting

### Issue: Refund Marked as Failed
**Solution:** 
- Check Razorpay credentials in `.env`
- Verify payment ID is correct
- Ensure payment is within refund window (usually 365 days)

### Issue: Email Not Sending
**Solution:**
- Verify EMAIL_USER and EMAIL_PASS in `.env`
- Check Gmail app-specific password is used
- Enable "Less secure app access" if needed

### Issue: Stock Not Restored After Cancellation
**Solution:**
- Check products.json file has write permissions
- Verify product stock schema matches (size-specific and total)
- Check server logs for stock update errors

