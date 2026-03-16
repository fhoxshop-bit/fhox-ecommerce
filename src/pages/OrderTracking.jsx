import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrderTracking.css';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const getProgressPercentage = (status) => {
    const stages = { pending: 0, accepted: 33, shipped: 66, delivered: 100, cancelled: 0 };
    return stages[status] || 0;
  };

  const getProgressLabel = (status) => {
    const labels = {
      pending: 'Order Pending',
      accepted: 'Order Accepted',
      shipped: 'Order Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const fetchOrder = async () => {
    try {
      const resp = await fetch(`http://localhost:5000/api/orders/user`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await resp.json();
      let found = data.find(o => o._id === orderId);
      
      // Fallback: if order items don't have imageUrl, fetch products to get images
      if (found && found.items && found.items.some(item => !item.imageUrl)) {
        try {
          const productsResp = await fetch('http://localhost:5000/api/products');
          const products = await productsResp.json();
          
          found = {
            ...found,
            items: found.items.map(item => {
              if (!item.imageUrl) {
                const product = products.find(p => String(p.id) === String(item.productId));
                return { ...item, imageUrl: product?.imageUrl || null };
              }
              return item;
            })
          };
        } catch (err) {
          console.error('Failed to fetch products for images:', err);
        }
      }
      
      setOrder(found);
    } catch (err) {
      console.error('Failed to fetch order', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn()) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, token, orderId]);

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const resp = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation' })
      });
      if (resp.ok) {
        alert('Order cancelled successfully. Refund will be processed in 5-7 days.');
        fetchOrder();
      } else {
        const error = await resp.json();
        alert(error.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order', err);
      alert('Error cancelling order');
    }
  };

  const requestReturn = async () => {
    if (!returnReason.trim()) {
      alert('Please enter a reason for the return');
      return;
    }

    try {
      const resp = await fetch(`http://localhost:5000/api/orders/${orderId}/request-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ reason: returnReason })
      });
      
      if (resp.ok) {
        alert('✓ Return request submitted!\nAdmin will review and process your refund within 3-5 days.');
        setShowReturnModal(false);
        setReturnReason('');
        fetchOrder();
      } else {
        const error = await resp.json();
        alert(error.message || 'Failed to request return');
      }
    } catch (err) {
      console.error('Error requesting return', err);
      alert('Error requesting return');
    }
  };

  if (loading) return (
    <div className="tracking-wrapper">
      <div className="tracking-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/orders')}>← Back to Orders</button>
        </div>
      </div>
      <div className="tracking-container">
        <p>Loading order details...</p>
      </div>
    </div>
  );
  
  if (!order) return (
    <div className="tracking-wrapper">
      <div className="tracking-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/orders')}>← Back to Orders</button>
        </div>
      </div>
      <div className="tracking-container">
        <p>Order not found</p>
      </div>
    </div>
  );

  return (
    <div className="tracking-wrapper">
      <div className="tracking-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/orders')}>← Back to Orders</button>
        </div>
      </div>
      <div className="tracking-container">
        <div className="tracking-card">
        <h1>Order Tracking</h1>
        <div className="order-header">
          <div>
            <p className="label">Order ID:</p>
            <p className="value">{order._id}</p>
          </div>
          <div>
            <p className="label">Order Date:</p>
            <p className="value">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="progress-section">
          <h2>Delivery Status</h2>
          <div className="status-container">
            <span className={`status-badge ${order.orderStatus}`}>{getProgressLabel(order.orderStatus)}</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${getProgressPercentage(order.orderStatus)}%` }}></div>
            </div>
            <div className="progress-labels">
              <div className="progress-step">
                <span className={getProgressPercentage(order.orderStatus) >= 0 ? 'active' : ''}>📋</span>
                <p>Pending</p>
              </div>
              <span className={getProgressPercentage(order.orderStatus) >= 33 ? 'active' : ''}>→</span>
              <div className="progress-step">
                <span className={getProgressPercentage(order.orderStatus) >= 33 ? 'active' : ''}>✓</span>
                <p>Accepted</p>
              </div>
              <span className={getProgressPercentage(order.orderStatus) >= 66 ? 'active' : ''}>→</span>
              <div className="progress-step">
                <span className={getProgressPercentage(order.orderStatus) >= 66 ? 'active' : ''}>📦</span>
                <p>Shipped</p>
              </div>
              <span className={getProgressPercentage(order.orderStatus) >= 100 ? 'active' : ''}>→</span>
              <div className="progress-step">
                <span className={getProgressPercentage(order.orderStatus) >= 100 ? 'active' : ''}>✅</span>
                <p>Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="items-section">
          <h2>Order Items</h2>
          <div className="items-grid">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="item-card">
                <div className="item-image-container">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="item-image" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-quantity">Quantity: {item.quantity}</p>
                  <p className="item-price">₹{item.price.toFixed(2)} each</p>
                  <p className="item-subtotal"><strong>Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="address-section">
          <h2>Shipping Address</h2>
          <div className="address-info">
            <p>{order.address.address1}</p>
            {order.address.address2 && <p>{order.address.address2}</p>}
            <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
            <p>{order.address.country}</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="payment-section">
          <h2>Payment Details</h2>
          <table className="payment-table">
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>₹{order.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>FREE</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>₹0.00</td>
              </tr>
              <tr className="total-row">
                <td>Total:</td>
                <td>₹{order.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Payment Method:</td>
                <td>{order.paymentMethod.toUpperCase()}</td>
              </tr>
              <tr>
                <td>Payment Status:</td>
                <td><span className={`payment-status ${order.paymentStatus}`}>{order.paymentStatus}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        {(order.orderStatus === 'pending' || order.orderStatus === 'accepted') && (
          <div className="action-section">
            <button className="cancel-order-btn" onClick={cancelOrder}>❌ Cancel Order</button>
            <p className="help-text">You can cancel this order before it ships</p>
          </div>
        )}

        {order.orderStatus === 'delivered' && order.paymentStatus === 'paid' && (
          <div className="action-section">
            <button className="return-order-btn" onClick={() => setShowReturnModal(true)}>↩️ Request Return</button>
            <p className="help-text">Not satisfied? Request a return and get a refund</p>
          </div>
        )}

        {order.orderStatus === 'return_requested' && (
          <div className="alert-box pending-return">⏳ Return request pending admin review</div>
        )}

        {order.orderStatus === 'cancelled' && (
          <div className="alert-box cancelled">❌ Order has been cancelled</div>
        )}

        {/* Return Modal */}
        {showReturnModal && (
          <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Request Return</h2>
              <p>Tell us why you want to return this order:</p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g., Product damaged, Wrong item received, Not as described, etc."
                maxLength={500}
                rows={5}
              />
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={requestReturn}>Submit Return Request</button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
