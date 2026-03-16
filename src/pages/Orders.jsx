import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

export default function Orders() {
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(null);
  const [returnReason, setReturnReason] = useState('');

  const fetchOrders = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/orders/user', {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await resp.json();
      
      // Fallback: if orders don't have imageUrl, try to fetch product images
      const ordersWithImages = await Promise.all(data.map(async (order) => {
        // Check if items already have imageUrl
        if (order.items && order.items.every(item => item.imageUrl)) {
          return order; // Images already present
        }
        
        // Fetch products to get images
        try {
          const productsResp = await fetch('http://localhost:5000/api/products');
          const products = await productsResp.json();
          
          // Add imageUrl to items that don't have it
          const itemsWithImages = order.items.map(item => {
            if (!item.imageUrl) {
              const product = products.find(p => String(p.id) === String(item.productId));
              return { ...item, imageUrl: product?.imageUrl || null };
            }
            return item;
          });
          
          return { ...order, items: itemsWithImages };
        } catch (err) {
          console.error('Failed to fetch products for images:', err);
          return order; // Return order without images if fetch fails
        }
      }));
      
      setOrders(ordersWithImages);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn()) {
      fetchOrders();
      // Poll for updates every 3 seconds
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  const handleViewTracking = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleReturnClick = (orderId) => {
    setShowReturnModal(orderId);
    setReturnReason('');
  };

  const requestReturn = async (orderId) => {
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
        setShowReturnModal(null);
        setReturnReason('');
        fetchOrders();
      } else {
        const error = await resp.json();
        alert(error.message || 'Failed to request return');
      }
    } catch (err) {
      console.error('Error requesting return', err);
      alert('Error requesting return');
    }
  };

  if (loading) return <div>Loading your orders...</div>;
  if (!isLoggedIn()) return <div>Please login to view your orders.</div>;

  return (
    <div className="orders-page">
      <button className="back-to-home-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p className="no-orders">You have no orders yet.</p>
      ) : (
        <div className="orders-container">
          {orders.map(o => (
            <div key={o._id} className="order-card">
              <div className="order-header-compact">
                {/* Left: First Item Photo */}
                <div className="order-header-left">
                  {o.items && o.items[0] && (
                    <div className="product-image-container-compact">
                      {o.items[0].imageUrl ? (
                        <img src={o.items[0].imageUrl} alt={o.items[0].name} className="product-image-compact" />
                      ) : (
                        <div className="no-image">📦</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Middle: Name, Price, Status, Date */}
                <div className="order-header-middle">
                  {o.items && o.items[0] && <p className="product-name-compact">{o.items[0].name}</p>}
                  <div className="price-status-group">
                    <span className="total-amount-compact">₹{o.total.toFixed(2)}</span>
                    <div className="badges-group-compact">
                      <span className={`status-badge ${o.orderStatus}`}>{o.orderStatus.toUpperCase()}</span>
                      <span className={`payment-badge ${o.paymentStatus}`}>{o.paymentMethod.toUpperCase()}</span>
                    </div>
                  </div>
                  <p className="order-date-compact">📅 {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>

                {/* Right: Order ID */}
                <div className="order-header-right-compact">
                  <p className="order-id-compact">ORDER ID<br/><span>{o._id.substring(0, 14)}...</span></p>
                </div>
              </div>

              <button onClick={() => handleViewTracking(o._id)} className="tracking-btn">
                📍 View Full Details & Tracking
              </button>
              {o.orderStatus === 'delivered' && o.paymentStatus === 'paid' && (
                <button onClick={() => handleReturnClick(o._id)} className="return-order-btn-compact">
                  ↩️ Request Return
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(null)}>
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
              <button className="cancel-btn" onClick={() => setShowReturnModal(null)}>Cancel</button>
              <button className="submit-btn" onClick={() => requestReturn(showReturnModal)}>Submit Return Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
