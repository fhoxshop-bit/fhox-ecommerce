import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

export default function Checkout() {
  const { cart, getTotalPrice, clearCart, getOrderSummary } = useCart();
  const { token, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [codAvailable, setCodAvailable] = useState(true);
  const [codUnavailableReason, setCodUnavailableReason] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    // Check COD availability and stock availability
    const checkAvailability = async () => {
      try {
        // Get global COD setting
        const settingsRes = await fetch('http://localhost:5000/api/settings/cod');
        const settings = await settingsRes.json();

        if (!settings.globalCodEnabled) {
          setCodAvailable(false);
          setCodUnavailableReason('Cash on Delivery is not available');
          setPaymentMethod('razorpay');
          return;
        }

        // Check if all products have COD available and sufficient stock
        const productsRes = await fetch('http://localhost:5000/api/products');
        const products = await productsRes.json();

        for (const cartItem of cart) {
          const product = products.find(p => String(p.id) === String(cartItem.id));
          
          if (!product) {
            alert(`Product not found for item in cart`);
            continue;
          }
          
          // Check size-specific stock
          // If size is undefined, check against total stock
          if (cartItem.size && product.sizeStock) {
            const availableStock = product.sizeStock[cartItem.size] || 0;
            
            if (availableStock < cartItem.quantity) {
              alert(`Insufficient stock for "${product.name}" in size ${cartItem.size}. Available: ${availableStock}, Requested: ${cartItem.quantity}`);
              clearCart();
              navigate('/collection');
              return;
            }
          } else if (!cartItem.size) {
            // Fallback for products without size selection (old products)
            if (product.stock < cartItem.quantity) {
              alert(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${cartItem.quantity}`);
              clearCart();
              navigate('/collection');
              return;
            }
          }
          
          // Check COD
          if (product && product.codAvailable === false) {
            setCodAvailable(false);
            setCodUnavailableReason(`Cash on Delivery not available for "${product.name}"`);
            setPaymentMethod('razorpay');
            return;
          }
        }

        setCodAvailable(true);
        setCodUnavailableReason('');
      } catch (err) {
        console.error('Error checking availability:', err);
        setCodAvailable(true);
      }
    };

    if (cart.length > 0) {
      checkAvailability();
    }
  }, [cart, clearCart, navigate]);

  useEffect(() => {
    // load razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  // Apply coupon
  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    // Check if user is logged in
    if (!user || !user.id) {
      setCouponError('Please log in to apply coupons');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const summary = getOrderSummary();
      const response = await fetch('http://localhost:5000/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          userId: user.id,
          orderTotal: summary.total
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('✓ Coupon validation response:', data);
        console.log('  - Coupon code:', data.coupon.code);
        console.log('  - Discount amount:', data.coupon.discountAmount);
        console.log('  - Assignment ID:', data.assignmentId);
        
        if (!data.assignmentId) {
          console.error('❌ WARNING: assignmentId is missing from validation response!');
        }
        
        // Include assignmentId in the coupon object
        const couponWithAssignment = {
          ...data.coupon,
          assignmentId: data.assignmentId
        };
        
        setAppliedCoupon(couponWithAssignment);
        setCouponCode('');
        setCouponError('');
      } else {
        setCouponError(data.message);
        setAppliedCoupon(null);
        console.error('❌ Coupon validation failed:', data.message);
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setCouponError('Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const createOrder = async (paymentId) => {
    const summary = getOrderSummary();
    const finalTotal = appliedCoupon ? appliedCoupon.finalPrice : summary.total;
    
    const orderPayload = {
      items: cart,
      address,
      paymentMethod,
      razorpayPaymentId: paymentId,
      total: finalTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponDiscount: appliedCoupon ? appliedCoupon.discountAmount : 0,
      flashDealDiscount: summary.flashDiscount || 0,
      originalTotal: summary.originalSubtotal || summary.total,
      subtotal: summary.subtotal,
      shipping: summary.shipping,
      tax: summary.tax
    };

    try {
      const resp = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(orderPayload)
      });
      const data = await resp.json();
      if (resp.ok) {
        // Mark coupon as used if applied
        if (appliedCoupon && appliedCoupon.assignmentId && data.order) {
          try {
            const orderId = data.order._id || data.order.id;
            console.log('📝 Marking coupon as used:');
            console.log('  - Order ID:', orderId);
            console.log('  - Coupon code:', appliedCoupon.code);
            console.log('  - Assignment ID:', appliedCoupon.assignmentId);
            
            const applyResp = await fetch('http://localhost:5000/api/coupons/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assignmentId: appliedCoupon.assignmentId,
                orderId: orderId
              })
            });
            
            const applyData = await applyResp.json();
            if (applyData.success) {
              console.log('✓ Coupon marked as used successfully');
            } else {
              console.error('❌ Failed to mark coupon as used:', applyData.message);
            }
          } catch (err) {
            console.error('❌ Error marking coupon as used:', err);
          }
        } else {
          if (!appliedCoupon) {
            console.log('ℹ️ No coupon applied to this order');
          } else if (!appliedCoupon.assignmentId) {
            console.error('❌ Coupon has no assignmentId!');
          }
        }

        clearCart();
        if (paymentMethod === 'razorpay') {
          alert('Payment successful! Your order has been placed.');
        } else {
          alert('Order placed successfully! Payment pending (COD).');
        }
        navigate('/orders');
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Checkout error', err);
      alert(err.message || 'Could not place order, please try again.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (paymentMethod === 'razorpay') {
      const summary = getOrderSummary();
      const finalTotal = appliedCoupon ? appliedCoupon.finalPrice : summary.total;
      
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        alert('Payment gateway not loaded. Please refresh the page and try again.');
        return;
      }

      // Get the API key
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;
      
      if (!razorpayKey) {
        alert('Razorpay API key not configured. Please check your .env file.');
        console.error('VITE_RAZORPAY_KEY not found in environment variables');
        return;
      }
      
      // Validate key format
      if (!razorpayKey.startsWith('rzp_test_') && !razorpayKey.startsWith('rzp_live_')) {
        alert('Invalid Razorpay API key. Please contact support or check your configuration.');
        console.error('Invalid Razorpay key format:', razorpayKey);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: Math.round(finalTotal * 100), // Amount in paise (with coupon applied)
        currency: 'INR',
        name: 'FHOX Shop',
        description: 'Order Payment',
        prefill: {
          email: user?.email || '',
          contact: user?.phone || ''
        },
        handler: function (response) {
          console.log('Payment successful:', response);
          createOrder(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled by user');
          }
        },
        theme: {
          color: '#ff6b00'
        }
      };
      
      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error);
          alert(`Payment failed: ${response.error.description || 'Unknown error'}`);
        });
        rzp.open();
      } catch (err) {
        console.error('Razorpay error:', err);
        alert('Payment gateway error. Please try again or contact support.');
      }
    } else {
      // COD
      createOrder();
    }
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      <form className="checkout-form" onSubmit={handleCheckout}>
        <h3>Shipping Address</h3>
        <input
          type="text"
          name="line1"
          placeholder="Address line 1"
          value={address.line1}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="line2"
          placeholder="Address line 2"
          value={address.line2}
          onChange={handleChange}
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={address.city}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          value={address.state}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="zip"
          placeholder="ZIP / Postal Code"
          value={address.zip}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={address.country}
          onChange={handleChange}
          required
        />

        <h3>Payment Method</h3>
        <label>
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
            disabled={!codAvailable}
          />
          Cash on Delivery
        </label>
        {!codAvailable && (
          <p className="cod-unavailable-message">
            ❌ {codUnavailableReason}
          </p>
        )}
        <label>
          <input
            type="radio"
            name="payment"
            value="razorpay"
            checked={paymentMethod === 'razorpay'}
            onChange={() => setPaymentMethod('razorpay')}
          />
          Razorpay
        </label>

        <h3>Order Summary</h3>
        <div className="order-items">
          {cart.map(item => {
            const flashDiscount = item.flashDealDiscount || 0;
            const originalPrice = item.price;
            const finalPrice = originalPrice * (1 - flashDiscount / 100);
            
            return (
              <div key={`${item.id}-${item.size}`} className="order-item">
                <div className="order-item-info">
                  <p className="order-item-name">{item.name}</p>
                  <p className="order-item-size">Size: <strong>{item.size}</strong></p>
                  <p className="order-item-qty">Qty: <strong>{item.quantity}</strong></p>
                  {flashDiscount > 0 && (
                    <p className="order-item-flash-deal">
                      🔥 Flash Deal: {flashDiscount}% OFF
                    </p>
                  )}
                </div>
                <div className="order-item-price-section">
                  {flashDiscount > 0 && (
                    <p className="order-item-original-price">₹{(originalPrice * item.quantity).toFixed(2)}</p>
                  )}
                  <p className="order-item-total">₹{(finalPrice * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coupon Section */}
        {!appliedCoupon ? (
          <div className="coupon-input-section">
            <p className="coupon-label">Have a coupon code?</p>
            <div className="coupon-form">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError('');
                }}
                className="coupon-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCoupon({ preventDefault: () => {} });
                  }
                }}
              />
              <button 
                type="button" 
                className="coupon-apply-btn" 
                disabled={couponLoading || !couponCode.trim()}
                onClick={(e) => {
                  e.preventDefault();
                  handleApplyCoupon({ preventDefault: () => {} });
                }}
              >
                {couponLoading ? 'Validating...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="coupon-error">{couponError}</p>}
          </div>
        ) : (
          <div className="coupon-applied-section">
            <div className="coupon-applied-box">
              <p className="coupon-applied-text">✓ Coupon Applied: <strong>{appliedCoupon.code}</strong></p>
              <p className="coupon-savings">{appliedCoupon.savings}</p>
              <button className="coupon-remove-btn" onClick={handleRemoveCoupon}>Remove</button>
            </div>
          </div>
        )}

        <div className="checkout-summary">
          {(getOrderSummary().flashDiscount > 0 || getOrderSummary().productDiscount > 0) && (
            <div className="summary-item info-item">
              <span>Original Subtotal:</span>
              <span>₹{getOrderSummary().originalSubtotal.toFixed(2)}</span>
            </div>
          )}
          {getOrderSummary().productDiscount > 0 && (
            <div className="summary-item discount-item">
              <span>💰 Product Discount:</span>
              <span className="discount-amount">-₹{getOrderSummary().productDiscount.toFixed(2)}</span>
            </div>
          )}
          {getOrderSummary().flashDiscount > 0 && (
            <div className="summary-item discount-item">
              <span>🔥 Flash Deal Discount:</span>
              <span className="discount-amount">-₹{getOrderSummary().flashDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-item">
            <span>Subtotal:</span>
            <span>₹{getOrderSummary().subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>Shipping (5%):</span>
            <span>₹{getOrderSummary().shipping.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>Tax (15%):</span>
            <span>₹{getOrderSummary().tax.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="summary-item discount-item">
              <span>Coupon Discount ({appliedCoupon.code}):</span>
              <span className="discount-amount">-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-item summary-total">
            <span>Total Amount:</span>
            <span>₹{(appliedCoupon ? appliedCoupon.finalPrice : getOrderSummary().total).toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" className="checkout-submit" disabled={loading}>
          {loading ? 'Processing...' : paymentMethod === 'razorpay' ? 'Pay & Place Order' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
