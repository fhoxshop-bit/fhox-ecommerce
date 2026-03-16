const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  imageUrl: String
});

const addressSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  zip: String,
  country: String
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  address: addressSchema,
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'partial_refund'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending', 'accepted', 'shipped', 'delivered', 'cancelled', 'return_requested'], default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  
  // Refund details
  refund: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'processed', 'failed'], default: 'none' },
    amount: { type: Number, default: 0 },
    reason: String,
    razorpayRefundId: String,
    requestedAt: Date,
    processedAt: Date,
    notes: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
