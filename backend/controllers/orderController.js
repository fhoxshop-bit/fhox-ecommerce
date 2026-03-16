const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderEmail } = require('../utils/orderEmailService');
const { readProducts, writeProducts } = require('./productController');
const { capturePayment, processRazorpayRefund, getRefundStatus, canRefundPayment } = require('../utils/razorpayService');
const fs = require('fs');
const path = require('path');

// Helper to read settings
function readSettings() {
  try {
    const settingsFile = path.join(__dirname, '..', 'settings.json');
    const raw = fs.readFileSync(settingsFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { globalCodEnabled: true };
  }
}

// create a new order
exports.createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod, razorpayPaymentId, total: frontendTotal } = req.body;
    const userId = req.user && req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate COD availability if COD payment method is selected
    if (paymentMethod === 'cod' || paymentMethod === 'COD') {
      const settings = readSettings();
      
      // Check if global COD is enabled
      if (!settings.globalCodEnabled) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cash on Delivery is not available. Please use another payment method.' 
        });
      }

      // Check if all products have COD available
      const products = readProducts();
      for (const item of items) {
        const product = products.find(p => String(p.id) === String(item.id || item.productId));
        if (product && product.codAvailable === false) {
          return res.status(400).json({ 
            success: false,
            message: `Cash on Delivery is not available for "${product.name}". Please remove it or use another payment method.`
          });
        }
      }
    }

    // map cart items to order items (convert id to productId)
    const products = readProducts();
    const orderItems = items.map(item => {
      const product = products.find(p => String(p.id) === String(item.id || item.productId));
      return {
        productId: item.id || item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        size: item.size || null,
        imageUrl: product ? product.imageUrl : null
      };
    });

    // Validate stock availability for all items
    const insufficientStock = [];
    
    orderItems.forEach(item => {
      const product = products.find(p => String(p.id) === String(item.productId));
      if (!product) {
        insufficientStock.push(`"${item.name}" - Product not found`);
      } else if (item.size && product.sizeStock) {
        // Check size-specific stock
        const availableStock = product.sizeStock[item.size] || 0;
        if (availableStock < item.quantity) {
          insufficientStock.push(`"${product.name}" (Size ${item.size}) - Only ${availableStock} available, but you ordered ${item.quantity}`);
        }
      } else if (!item.size) {
        // Check total stock for non-sized products
        if (!product.stock || product.stock <= 0) {
          insufficientStock.push(`"${product.name}" - Out of stock`);
        } else if (product.stock < item.quantity) {
          insufficientStock.push(`"${product.name}" - Only ${product.stock} available, but you ordered ${item.quantity}`);
        }
      }
    });

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock: ' + insufficientStock.join('; ')
      });
    }

    // calculate total server-side with taxes and shipping
    let subtotal = 0;
    orderItems.forEach(item => {
      subtotal += (item.price || 0) * (item.quantity || 1);
    });
    
    const shipping = subtotal * 0.05; // 5% shipping
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + shipping + tax;
    
    // Validate total from frontend (if provided) matches our calculation
    // Allow small floating point discrepancy (within 1 paise)
    if (frontendTotal && Math.abs(total - frontendTotal) > 0.01) {
      console.warn(`Total mismatch. Calculated: ${total}, Frontend: ${frontendTotal}`);
    }
    
    const finalTotal = frontendTotal || total;

    const order = new Order({
      user: userId,
      items: orderItems,
      total: finalTotal,
      address,
      paymentMethod,
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
      orderStatus: 'pending',
      razorpayPaymentId: razorpayPaymentId || undefined
    });

    await order.save();

    // Decrease product stock (both total and size-specific)
    let stockChanged = false;
    orderItems.forEach(item => {
      const idx = products.findIndex(p => String(p.id) === String(item.productId));
      if (idx !== -1) {
        const product = products[idx];
        
        // Update size-specific stock if size exists
        if (item.size && product.sizeStock && product.sizeStock[item.size] !== undefined) {
          product.sizeStock[item.size] = Math.max(0, product.sizeStock[item.size] - item.quantity);
          console.log(`[Order] Updated size stock - Product: ${product.id}, Size: ${item.size}, New stock: ${product.sizeStock[item.size]}`);
          stockChanged = true;
        }
        
        // Also update total stock
        if (product.stock && product.stock > 0) {
          product.stock = Math.max(0, product.stock - item.quantity);
          console.log(`[Order] Updated total stock - Product: ${product.id}, New total stock: ${product.stock}`);
          stockChanged = true;
        }
      }
    });
    if (stockChanged) writeProducts(products);

    // Fetch user email and send notification
    const user = await User.findById(userId);
    if (user && user.email) {
      sendOrderEmail(user.email, order, 'placed');
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

// get orders for current user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'email customerName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// update order status or payment status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'email customerName');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    if (orderStatus) {
      order.orderStatus = orderStatus;
      // when delivered, auto-mark payment for COD
      if (
        orderStatus === 'delivered' &&
        order.paymentMethod === 'cod' &&
        order.paymentStatus === 'pending'
      ) {
        order.paymentStatus = 'paid';
      }
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Send email notification if status changed
    if (oldStatus !== orderStatus && order.user && order.user.email) {
      sendOrderEmail(order.user.email, order, orderStatus);
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
};

// cancel an order (user)
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    const { reason } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.user._id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // only allow cancel if pending or accepted, NOT if shipped/delivered
    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel order at this stage' });
    }

    order.orderStatus = 'cancelled';
    
    // If payment was made, initiate refund
    if (order.paymentStatus === 'paid') {
      if (order.paymentMethod === 'razorpay' && order.razorpayPaymentId) {
        // Mark as refund pending - actual refund will happen in separate endpoint
        order.paymentStatus = 'refunded';
        order.refund.status = 'pending';
        order.refund.amount = order.total;
        order.refund.reason = reason || 'Order cancelled by user';
        order.refund.requestedAt = new Date();
      } else if (order.paymentMethod === 'cod') {
        // For COD, no payment to refund
        order.paymentStatus = 'pending'; // No money to refund
      }
    }

    await order.save();

    // Restore product stock
    const products = readProducts();
    let stockChanged = false;
    
    order.items.forEach(item => {
      const idx = products.findIndex(p => String(p.id) === String(item.productId));
      if (idx !== -1) {
        const product = products[idx];
        
        // Restore size-specific stock if applicable
        if (item.size && product.sizeStock && product.sizeStock[item.size] !== undefined) {
          product.sizeStock[item.size] = (product.sizeStock[item.size] || 0) + item.quantity;
          stockChanged = true;
        }
        
        // Restore total stock
        if (product.stock !== undefined) {
          product.stock = (product.stock || 0) + item.quantity;
          stockChanged = true;
        }
      }
    });
    
    if (stockChanged) writeProducts(products);

    // Send cancellation email
    if (order.user && order.user.email) {
      sendOrderEmail(order.user.email, order, 'cancelled');
    }

    res.json({ 
      success: true, 
      order,
      message: order.paymentMethod === 'razorpay' ? 'Order cancelled. Refund initiated and will be processed within 5-7 business days.' : 'Order cancelled successfully.'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Process refund for a cancelled order (admin endpoint)
exports.processRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'email customerName');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order is eligible for refund
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'return_requested') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only cancelled or return-requested orders can be refunded' 
      });
    }

    // Only check refund.status to prevent duplicate processing
    if (order.refund.status === 'processed') {
      return res.status(400).json({ 
        success: false, 
        message: 'This order has already been refunded' 
      });
    }

    const isReturn = order.orderStatus === 'return_requested';

    // Handle COD orders - mark as processed (manual refund)
    if (order.paymentMethod === 'cod' || order.paymentMethod === 'COD') {
      order.refund.status = 'processed';
      order.refund.processedAt = new Date();
      order.refund.notes = 'COD Order - Manual refund required via cash/UPI/bank transfer';
      order.paymentStatus = 'refunded';
      
      await order.save();

      // Send email notification based on type
      if (order.user && order.user.email) {
        const emailStatus = isReturn ? 'return_approved' : 'refunded';
        sendOrderEmail(order.user.email, order, emailStatus);
      }

      const message = isReturn 
        ? 'Return approved! Please contact customer to arrange pickup and provide manual refund.'
        : 'COD order cancellation processed. No refund needed.';

      return res.json({ 
        success: true, 
        message: message,
        refund: {
          refundId: 'COD-MANUAL',
          amount: order.refund.amount,
          status: 'processed',
          processedAt: order.refund.processedAt,
          notes: isReturn ? 'Manual refund required after item return' : 'No refund needed'
        }
      });
    }

    // Handle Razorpay orders
    if (order.paymentMethod !== 'razorpay' || !order.razorpayPaymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unknown payment method. Cannot process refund.' 
      });
    }

    // Check if payment can be refunded
    const refundEligibility = await canRefundPayment(order.razorpayPaymentId);
    if (!refundEligibility.canRefund) {
      // If payment is not captured, try to capture it first
      if (refundEligibility.details && refundEligibility.details.status === 'authorized') {
        console.log(`Payment is authorized. Attempting to capture before refund: ${order.razorpayPaymentId}`);
        const captureResult = await capturePayment(order.razorpayPaymentId, order.refund.amount);
        
        if (!captureResult.success) {
          return res.status(400).json({ 
            success: false, 
            message: `Cannot capture payment: ${captureResult.error}. Please capture manually in Razorpay dashboard first.` 
          });
        }
        console.log(`Payment captured successfully: ${captureResult.paymentId}`);
      } else {
        return res.status(400).json({ 
          success: false, 
          message: refundEligibility.reason || 'This payment cannot be refunded (expired or invalid)' 
        });
      }
    }

    // Process refund via Razorpay
    const refundResult = await processRazorpayRefund(
      order.razorpayPaymentId,
      order.refund.amount,
      order.refund.reason
    );

    if (!refundResult.success) {
      order.refund.status = 'failed';
      order.refund.notes = refundResult.error;
      await order.save();
      
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to process refund',
        error: refundResult.error
      });
    }

    // Update order with refund details
    order.refund.status = 'processed';
    order.refund.razorpayRefundId = refundResult.refundId;
    order.refund.processedAt = new Date();
    order.paymentStatus = 'refunded';
    
    await order.save();

    // Send refund confirmation email based on type
    if (order.user && order.user.email) {
      const emailStatus = isReturn ? 'return_approved' : 'refunded';
      sendOrderEmail(order.user.email, order, emailStatus);
    }

    res.json({ 
      success: true, 
      message: isReturn ? 'Return approved! Refund processed successfully.' : 'Refund processed successfully',
      refund: {
        refundId: refundResult.refundId,
        amount: order.refund.amount,
        status: 'processed',
        processedAt: order.refund.processedAt
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund', error: error.message });
  }
};

// Request refund/return (user endpoint)
exports.requestRefund = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to request refund for this order' });
    }

    // Only allow refund requests for delivered orders
    if (order.orderStatus === 'delivered') {
      order.orderStatus = 'return_requested';
      order.refund.status = 'pending';
      order.refund.amount = order.total;
      order.refund.reason = reason || 'Return requested by customer';
      order.refund.requestedAt = new Date();
      
      await order.save();

      // Send return request confirmation email
      if (order.user && order.user.email) {
        sendOrderEmail(order.user.email, order, 'return_requested');
      }

      const message = order.paymentMethod === 'cod' 
        ? 'Return request submitted. Admin will contact you about returning the item and refunding payment method.' 
        : 'Return request submitted. Admin will review and process your online refund.';

      return res.json({ 
        success: true, 
        message,
        order 
      });
    }

    // Cannot request refund for never delivered orders
    if (order.orderStatus === 'pending' || order.orderStatus === 'accepted' || order.orderStatus === 'shipped') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only request returns for delivered orders' 
      });
    }

    res.status(400).json({ success: false, message: 'This order is not eligible for return/refund' });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ success: false, message: 'Failed to request refund' });
  }
};

// Get refund status
exports.getRefundStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentMethod === 'razorpay' && order.refund.razorpayRefundId) {
      // Fetch latest status from Razorpay
      const statusResult = await getRefundStatus(order.refund.razorpayRefundId);
      
      if (statusResult.success) {
        return res.json({
          success: true,
          refund: {
            status: statusResult.data.status,
            amount: statusResult.data.amount / 100, // Convert from paise to rupees
            razorpayRefundId: statusResult.data.id,
            createdAt: new Date(statusResult.data.created_at * 1000)
          }
        });
      }
    }

    // Return local refund data if no Razorpay refund or error
    res.json({
      success: true,
      refund: order.refund
    });
  } catch (error) {
    console.error('Error getting refund status:', error);
    res.status(500).json({ success: false, message: 'Failed to get refund status' });
  }
};
