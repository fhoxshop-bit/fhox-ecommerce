# Refund System - Visual Guide

## 🔄 Complete Refund Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER INITIATED REFUND                            │
└─────────────────────────────────────────────────────────────────────────────┘

SCENARIO 1: Pending/Accepted Order → Cancellation

    [Customer Views Order]
             ↓
    [Order Status = PENDING]  OR  [Order Status = ACCEPTED]
             ↓
    [Customer Clicks "Cancel Order"]
             ↓
    ┌─────────────────────────────────┐
    │  POST /api/orders/{id}/cancel   │
    │  Body: { reason: "..." }        │
    └─────────────────────────────────┘
             ↓
    ✓ Check User Owns Order
    ✓ Check Order Status
    ✓ If Razorpay: Mark Refund.status = 'pending'
    ✓ If COD: Skip refund
    ✓ Restore Product Stock
    ✓ Send Email: "Order Cancelled"
             ↓
    [Order Status = CANCELLED]
    [Refund Status = PENDING]
    [Stock Updated]
             ↓
    Customer Receives Email:
    "Your refund is being processed (5-7 days)"


SCENARIO 2: Delivered Order → Return Request

    [Customer Views Delivered Order]
             ↓
    [Order Status = DELIVERED]
    [Payment Status = PAID]
             ↓
    [Customer Clicks "Request Return"]
             ↓
    ┌──────────────────────────────────────────┐
    │  POST /api/orders/{id}/request-refund    │
    │  Body: { reason: "Damaged/Wrong item" }  │
    └──────────────────────────────────────────┘
             ↓
    ✓ Check User Owns Order
    ✓ Check Order Status = DELIVERED
    ✓ Mark Order Status = RETURN_REQUESTED
    ✓ Set Refund.status = 'pending'
    ✓ Send Email: "Return Request Received"
             ↓
    [Order Status = RETURN_REQUESTED]
    [Awaiting Admin Review]
             ↓
    Customer Receives Email:
    "Admin will review your return within 3-5 days"
    Admin Gets Alert about pending return


┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN PROCESSES REFUND                              │
└─────────────────────────────────────────────────────────────────────────────┘

    [Admin Logs Into Dashboard]
             ↓
    [Admin Sees Pending Refunds]
    ├─ Order #1234: Cancelled, Refund ₹999.99
    ├─ Order #5678: Return Requested, Refund ₹1499.99
    └─ Order #9012: Processing...
             ↓
    [Admin Selects Order & Clicks "Process Refund"]
             ↓
    ┌────────────────────────────────────────────────┐
    │  POST /api/orders/{id}/process-refund (ADMIN)  │
    │  Headers: Authorization: Bearer {adminToken}   │
    └────────────────────────────────────────────────┘
             ↓
    [Backend Validation]
    ├─ ✓ Order Status = CANCELLED or RETURN_REQUESTED
    ├─ ✓ Payment Method = RAZORPAY (not COD)
    ├─ ✓ Refund.status = PENDING
    ├─ ✓ Razorpay Payment ID exists
    └─ ✓ Payment is not expired (< 365 days)
             ↓
    [Call Razorpay API]
    └─ POST https://api.razorpay.com/v1/payments/{id}/refund
       ├─ Amount: 999.99 (in paise = 99999)
       ├─ Reason: "Customer Cancellation"
       └─ Response: { id: "rfnd_1234567890", ... }
             ↓
    [Update Database]
    ├─ Set Refund.status = 'processed'
    ├─ Set Refund.razorpayRefundId = 'rfnd_1234567890'
    ├─ Set Refund.processedAt = NOW
    ├─ Set PaymentStatus = 'refunded'
    └─ Save Order
             ↓
    [Send Confirmation Email]
    └─ "Refund Processed Successfully"
       ├─ Refund ID: rfnd_1234567890
       ├─ Amount: ₹999.99
       ├─ Timeline: 5-7 business days
       └─ Account Details: [last 4 digits]
             ↓
    [Return Success Response to Admin]
    └─ {
         success: true,
         refund: {
           refundId: 'rfnd_1234567890',
           amount: 999.99,
           status: 'processed',
           processedAt: '2024-03-13T10:35:00Z'
         }
       }
             ↓
    [Refund Processing Complete]
    └─ Bank Transfer in Progress (5-7 days)


┌─────────────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER CHECKS REFUND STATUS                           │
└─────────────────────────────────────────────────────────────────────────────┘

    [Customer Checks "Refund Status"]
             ↓
    ┌──────────────────────────────────────────────┐
    │  GET /api/orders/{id}/refund-status          │
    │  Headers: Authorization: Bearer {userToken}  │
    └──────────────────────────────────────────────┘
             ↓
    [Backend Actions]
    ├─ Find Order
    ├─ If razorpayRefundId exists:
    │  └─ Call Razorpay API: GET /refunds/{id}
    │     └─ Get live status from Razorpay
    └─ Return Refund Details
             ↓
    [Response to Customer]
    └─ {
         success: true,
         refund: {
           status: 'processed',
           amount: 999.99,
           razorpayRefundId: 'rfnd_1234567890',
           processedAt: '2024-03-13T10:35:00Z'
         }
       }
             ↓
    [Customer Sees Status]
    "✓ Refund Processed!"
    "Amount: ₹999.99"
    "Refund ID: rfnd_1234567890"
    "Timeline: 5-7 business days"
```

---

## 🏗️ Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE (React)                       │
├───────────────────────────────────────────────────────────────────┤
│  [Cancel Button]  [Return Modal]  [Status Display]  [Admin Panel] │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
          ┌─────────────────────────────────┐
          │   API Gateway / Express.js      │
          │   Port: 5000                    │
          └────────┬────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
  ┌───────────────┐  ┌──────────────────┐
  │ 4 New Routes  │  │ 4 API Endpoints  │
  ├───────────────┤  ├──────────────────┤
  │ /cancel       │  │ POST /status     │
  │ /request-refund│  │ PUT /payment     │
  │ /refund-status │  │ GET /orders      │
  │ /process-refund│  │ PATCH /details   │
  └───────┬───────┘  └──────────────────┘
          │
    ┌─────┴───────────┐
    ↓                 ↓
┌─────────────────┐ ┌──────────────────────┐
│ Order Controller│ │ Razorpay Service     │
├─────────────────┤ ├──────────────────────┤
│ cancelOrder()   │ │ processRefund()      │
│ requestRefund() │ │ getRefundStatus()    │
│ processRefund() │ │ canRefundPayment()   │
│ getRefundStatus()│ └──────┬───────────────┘
└────────┬────────┘        │
         │          ┌──────┴────────┐
         │          ↓               ↓
         │    ┌───────────────┐  ┌─────────┐
         │    │ Razorpay API  │  │Validate │
         │    │ Https Calls   │  │Payment  │
         │    └───────┬───────┘  └─────────┘
         │            │
         │    ┌───────┴──────────┐
         │    │ Authorization    │
         │    │ (Basic Auth)     │
         │    │ KEY_ID:SECRET    │
         │    └──────────────────┘
         │
         ↓
    ┌─────────────────┐
    │  Database       │
    │  (MongoDB)      │
    ├─────────────────┤
    │ Order           │
    │  └─ refund      │
    │    └─ status    │
    │    └─ amount    │
    │    └─ razorpayId│
    │    └─ dates     │
    │                 │
    │ Products        │
    │  └─ stock       │
    │  └─ sizeStock   │
    └─────────────────┘
         │
         ↓
    ┌─────────────────┐
    │  Email Service  │
    │  (Nodemailer)   │
    ├─────────────────┤
    │ Order Cancelled │
    │ Return Received │
    │ Refund Processed│
    └─────────────────┘
         │
         ↓
    ┌─────────────────┐
    │  Gmail SMTP     │
    │  Send Emails    │
    └─────────────────┘
```

---

## 📊 State Transition Diagram

```
RAZORPAY PAYMENT FLOW:

Create Order
       ↓
[Payment Method: RAZORPAY]
  [Payment Status: paid]
  [Order Status: pending]
  [Refund Status: none]
       ↓
User Action: Cancel
       ↓
[Payment Status: refunded]
[Order Status: cancelled]
[Refund Status: pending] ← Waiting for admin
       ↓
Admin Action: Process Refund
       ↓
Call Razorpay API
       ↓
Success:
  [Payment Status: refunded]
  [Order Status: cancelled]
  [Refund Status: processed]
  [Refund ID: rfnd_XXXXX]

OR

Failure:
  [Payment Status: pending]
  [Order Status: cancelled]
  [Refund Status: failed]
  [Error: payment_not_found]


RETURN FLOW:

Create Order
       ↓
[Order Status: pending] 
  → [accepted] 
  → [shipped] 
  → [delivered]
       ↓
       [Payment Status: paid]
       ↓
User Action: Request Return
       ↓
[Order Status: return_requested]
[Refund Status: pending]
       ↓
Admin Action: Process Refund
       ↓
[Order Status: return_requested]
[Payment Status: refunded]
[Refund Status: processed]
```

---

## 🎯 API Request/Response Flow

```
1. CANCEL REQUEST
   ┌──────────────────────────────────────┐
   │ User clicks "Cancel Order"           │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Frontend sends:                      │
   │ POST /api/orders/{id}/cancel         │
   │ Headers: Authorization: Bearer {JWT} │
   │ Body: { reason: "..." }              │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Backend processes:                   │
   │ ✓ Validate user                     │
   │ ✓ Check order status                │
   │ ✓ Initiate refund                   │
   │ ✓ Restore stock                     │
   │ ✓ Send email                        │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Response to Frontend:                │
   │ {                                    │
   │   success: true,                     │
   │   order: {...},                      │
   │   message: "Order cancelled..."      │
   │ }                                    │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Frontend displays:                   │
   │ "✓ Order cancelled successfully!"    │
   │ "Refund will process in 5-7 days"    │
   └──────────────────────────────────────┘


2. PROCESS REFUND REQUEST
   ┌──────────────────────────────────────┐
   │ Admin clicks "Process Refund"        │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Frontend sends:                      │
   │ POST /api/orders/{id}/process-refund │
   │ Headers: Authorization: Bearer {JWT} │
   │ (no body needed)                     │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Backend validates:                   │
   │ ✓ Order status = cancelled           │
   │ ✓ Payment method = razorpay          │
   │ ✓ Refund status = pending            │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Backend calls Razorpay:              │
   │ POST /payments/{id}/refund           │
   │ With: amount, reason, notes          │
   │ Response: { id: "rfnd_...", ... }    │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Backend updates database:            │
   │ ✓ Store refund ID                    │
   │ ✓ Update refund status               │
   │ ✓ Set processed date                 │
   │ ✓ Send confirmation email            │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Response to Frontend:                │
   │ {                                    │
   │   success: true,                     │
   │   refund: {                          │
   │     refundId: "rfnd_...",            │
   │     amount: 999.99,                  │
   │     status: "processed"              │
   │   }                                  │
   │ }                                    │
   └──────────────┬───────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │ Frontend displays:                   │
   │ "✓ Refund processed!"                │
   │ "Refund ID: rfnd_1234567890"         │
   │ "Amount: ₹999.99"                    │
   └──────────────────────────────────────┘
```

---

## 🔐 Data Security Flow

```
┌─────────────────────────────────────┐
│   Frontend (React)                  │
│   ├─ User Token (JWT)              │
│   └─ (No sensitive data)           │
└────────────────┬────────────────────┘
                 │ HTTPS/TLS Encrypted
                 ↓
┌─────────────────────────────────────┐
│   Backend (Express.js)              │
│   ├─ Verify JWT Token              │
│   ├─ Validate User ID              │
│   ├─ Check Authorization           │
│   └─ Sanitize Inputs               │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        ↓                 ↓
  ┌──────────┐    ┌──────────────────┐
  │ Razorpay │    │    Database      │
  │ .env     │    │   MongoDB        │
  │ Keys:    │    │   ├─ Order       │
  │ KEY_ID   │    │   ├─ Refund      │
  │ SECRET   │    │   └─ Products    │
  └────┬─────┘    └──────────────────┘
       │
       ↓
  HTTPS API Call
  (Basic Auth)
  ├─ Authorization: Basic {base64(id:secret)}
  ├─ Content-Type: application/json
  └─ Body: Encrypted

       ↓
  Razorpay Servers
  ├─ Verify Credentials
  ├─ Process Refund
  └─ Return Refund ID

       ↓
  Backend
  ├─ Store Refund ID (encrypted)
  ├─ Never store/share SECRET
  └─ Never log sensitive data
```

---

## 📧 Email Flow

```
Refund Event Triggered
       ↓
┌──────────────────────┐
│  Which Event?        │
├──────────────────────┤
│ 1. Order Cancelled   │
│ 2. Return Requested  │
│ 3. Refund Processed  │
└──────┬───────────────┘
    ┌──┴──┬──┬──┐
    ↓     ↓  ↓  ↓

1. Cancelled Email:
   ├─ To: customer@email.com
   ├─ Subject: "Order Cancelled - Your Refund is Processing"
   ├─ Body:
   │  ├─ Order ID: #1234567
   │  ├─ Refund Amount: ₹999.99
   │  ├─ Timeline: 5-7 business days
   │  └─ Support Link
   └─ Trigger: When user clicks cancel

2. Return Requested Email:
   ├─ To: customer@email.com
   ├─ Subject: "Return Request Received"
   ├─ Body:
   │  ├─ Order ID: #1234567
   │  ├─ Reason: [user provided]
   │  ├─ Amount: ₹999.99
   │  └─ "Admin will review in 3-5 days"
   └─ Trigger: When user requests return

3. Refund Processed Email:
   ├─ To: customer@email.com
   ├─ Subject: "Refund Processed - Funds Returned"
   ├─ Body:
   │  ├─ Order ID: #1234567
   │  ├─ Refund ID: rfnd_1234567890
   │  ├─ Amount: ₹999.99
   │  ├─ Processed Date: 2024-03-13
   │  └─ "Bank transfer: 5-7 days"
   └─ Trigger: When admin processes refund

       ↓
┌──────────────────────┐
│ Gmail SMTP Server    │
│ (via Nodemailer)     │
└──────┬───────────────┘
       │
       ↓
   Customer Inbox
   ├─ Email Received
   ├─ Read Status Tracked
   └─ Link Clicks Tracked
```

---

## ✅ Complete Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM (Ready for Use)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend Components (React)                                    │
│  ├─ CancelOrderButton                                          │
│  ├─ ReturnRequestModal                                         │
│  ├─ RefundStatusTracker                                        │
│  └─ AdminRefundProcessor                                       │
│                                                                  │
│  Backend APIs                                                   │
│  ├─ POST /api/orders/{id}/cancel                               │
│  ├─ POST /api/orders/{id}/request-refund                       │
│  ├─ GET /api/orders/{id}/refund-status                         │
│  └─ POST /api/orders/{id}/process-refund                       │
│                                                                  │
│  Business Logic                                                 │
│  ├─ Order Status Transitions                                   │
│  ├─ Refund Status Management                                   │
│  ├─ Stock Restoration                                          │
│  ├─ Razorpay Integration                                       │
│  └─ Email Notifications                                        │
│                                                                  │
│  Database                                                       │
│  ├─ Order Model (with refund schema)                           │
│  ├─ Product Stock Tracking                                     │
│  └─ Refund History                                             │
│                                                                  │
│  Email Service                                                  │
│  ├─ Cancellation Notifications                                 │
│  ├─ Return Request Alerts                                      │
│  └─ Refund Confirmation Emails                                 │
│                                                                  │
│  External Integration                                           │
│  ├─ Razorpay API (Refunds)                                     │
│  ├─ Gmail SMTP (Email)                                         │
│  └─ MongoDB (Database)                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**System is fully implemented, documented, and ready for deployment!** 🚀
