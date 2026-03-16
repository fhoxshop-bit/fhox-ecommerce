import React, { useState, useEffect } from 'react';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingCancellations, setPendingCancellations] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [processingRefund, setProcessingRefund] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminAuthToken');
    if (savedToken) {
      setToken(savedToken);
    } else {
      setError('No authentication token found. Please login again.');
      setLoading(false);
    }
  }, []);

  const fetchOrders = async () => {
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const resp = await fetch('http://localhost:5000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const data = await resp.json();
      setOrders(data || []);
      setPendingCount(data.filter(o => o.orderStatus === 'pending').length);
      
      // Separate cancellations from returns
      const allRefundPending = data.filter(o => o.refund?.status === 'pending' && (o.orderStatus === 'cancelled' || o.orderStatus === 'return_requested'));
      setPendingCancellations(allRefundPending.filter(o => o.orderStatus === 'cancelled'));
      setPendingReturns(allRefundPending.filter(o => o.orderStatus === 'return_requested'));
      
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setError(`Failed to fetch orders: ${err.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const updateStatus = async (orderId, status) => {
    try {
      const resp = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: status })
      });
      if (!resp.ok) {
        alert('Failed to update order status');
        return;
      }
      fetchOrders();
    } catch (err) {
      console.error('Error updating order', err);
      alert('Error updating order');
    }
  };

  const getButtonForStatus = (order) => {
    if (order.orderStatus === 'pending') {
      return <button onClick={() => updateStatus(order._id, 'accepted')} className="action-btn accept-btn">✓ Accept Order</button>;
    } else if (order.orderStatus === 'accepted') {
      return <button onClick={() => updateStatus(order._id, 'shipped')} className="action-btn ship-btn">📦 Mark Shipped</button>;
    } else if (order.orderStatus === 'shipped') {
      return <button onClick={() => updateStatus(order._id, 'delivered')} className="action-btn deliver-btn">✓ Mark Delivered</button>;
    }
    return <span className="status-complete">Completed</span>;
  };

  const processRefund = async (orderId) => {
    // Find the order to check its status first
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      alert('Order not found');
      return;
    }

    // Check if already processed
    if (order.refund?.status === 'processed') {
      alert('✓ This order has already been processed.');
      return;
    }

    // Check if order is in correct status for refund
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'return_requested') {
      alert(`❌ Cannot process this order.\n\nCurrent order status: ${order.orderStatus}`);
      return;
    }

    const isReturn = order.orderStatus === 'return_requested';
    const isCOD = order.paymentMethod === 'cod' || order.paymentMethod === 'COD';
    const typeLabel = isReturn ? 'Return' : 'Cancellation';
    const paymentLabel = isCOD ? 'COD (Manual Refund)' : 'Razorpay';

    // Confirm action with different messages
    let confirmMsg = '';
    if (isReturn && isCOD) {
      confirmMsg = `Approve return for COD order?\n\nMake sure you have received the item back before approving.\nYou will need to refund the customer manually.`;
    } else if (isReturn && !isCOD) {
      confirmMsg = `Process refund for returned Razorpay order?\n\nThis will process the refund through Razorpay.`;
    } else if (!isReturn && isCOD) {
      confirmMsg = `This is a COD cancellation (auto-handled).\n\nNo refund processing needed.`;
      // For COD cancellations, just confirm
    } else {
      confirmMsg = `Process refund for cancelled Razorpay order?\n\nThis will process the refund through Razorpay.`;
    }

    if (!window.confirm(confirmMsg)) return;
    
    setProcessingRefund(orderId);
    try {
      const resp = await fetch(`http://localhost:5000/api/orders/${orderId}/process-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await resp.json();

      if (resp.ok) {
        // Different success messages
        if (isCOD && isReturn) {
          alert(`✓ Return approved!\n\nCustomer notified via email.\n\nReminder: Arrange pickup and process manual refund via cash/UPI/bank transfer.`);
        } else if (isCOD && !isReturn) {
          alert(`✓ Cancellation processed!\n\nCustomer has been notified.\n\nCOD order - no refund needed.`);
        } else if (isReturn) {
          alert(`✓ Return approved!\n\nRefund ID: ${data.refund.refundId}\nAmount: ₹${data.refund.amount}\n\nCustomer notified via email.\nRefund will be processed within 5-7 business days.`);
        } else {
          alert(`✓ Refund processed successfully!\n\nRefund ID: ${data.refund.refundId}\nAmount: ₹${data.refund.amount}\n\nCustomer has been notified via email.`);
        }
        fetchOrders();
      } else {
        const errorMsg = data.message || data.error || 'Unknown error';
        alert(`❌ Failed to process ${typeLabel}:\n\n${errorMsg}`);
      }
    } catch (err) {
      console.error('Error processing refund', err);
      alert(`❌ Error processing:\n\n${err.message}`);
    } finally {
      setProcessingRefund(null);
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
          <h1>All Orders</h1>
          {pendingCount > 0 && <span className="pending-badge">{pendingCount} Pending</span>}
          {pendingCancellations.length > 0 && <span className="pending-badge cancel-badge" style={{marginLeft: '10px'}}>⚡ {pendingCancellations.length} Cancellations</span>}
          {pendingReturns.length > 0 && <span className="pending-badge return-badge" style={{marginLeft: '10px'}}>🔄 {pendingReturns.length} Returns</span>}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      {/* Pending Cancellations Section */}
      {pendingCancellations.length > 0 && (
        <div className="pending-cancellations-section">
          <h2>⚡ Pending Cancellations ({pendingCancellations.length})</h2>
          <p style={{fontSize: '12px', color: '#666', marginBottom: '15px'}}>
            Orders cancelled by users. COD orders are auto-handled, Razorpay orders need refund processing.
          </p>
          <table className="returns-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Reason</th>
                <th>Cancelled</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingCancellations.map(order => (
                <tr key={order._id} className="cancel-row">
                  <td><strong>{order._id.substring(0, 10)}...</strong></td>
                  <td>{(order.user && order.user.email) || 'N/A'}</td>
                  <td><strong>₹{order.refund?.amount?.toFixed(2) || order.total.toFixed(2)}</strong></td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: order.paymentMethod === 'cod' ? '#d4edda' : '#cce5ff',
                      color: order.paymentMethod === 'cod' ? '#155724' : '#004085'
                    }}>
                      {order.paymentMethod === 'cod' ? '💵 COD (Auto)' : '💳 Razorpay'}
                    </span>
                  </td>
                  <td>{order.refund?.reason || 'N/A'}</td>
                  <td>{order.refund?.requestedAt ? new Date(order.refund.requestedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {order.paymentMethod === 'cod' ? (
                      <span style={{color: '#28a745', fontWeight: '600', fontSize: '12px'}}>✓ Auto-Handled</span>
                    ) : (
                      <button 
                        onClick={() => processRefund(order._id)}
                        disabled={processingRefund === order._id}
                        className="action-btn refund-btn"
                      >
                        {processingRefund === order._id ? '⏳ Processing...' : '💰 Process Refund'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Returns Section */}
      {pendingReturns.length > 0 && (
        <div className="pending-returns-section">
          <h2>🔄 Pending Return Requests ({pendingReturns.length})</h2>
          <p style={{fontSize: '12px', color: '#666', marginBottom: '15px'}}>
            Orders returned by users after delivery. COD returns: manual refund. Razorpay returns: process refund.
          </p>
          <table className="returns-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Return Reason</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingReturns.map(order => (
                <tr key={order._id} className="return-row">
                  <td><strong>{order._id.substring(0, 10)}...</strong></td>
                  <td>{(order.user && order.user.email) || 'N/A'}</td>
                  <td><strong>₹{order.refund?.amount?.toFixed(2) || order.total.toFixed(2)}</strong></td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: order.paymentMethod === 'cod' ? '#fff3cd' : '#cce5ff',
                      color: order.paymentMethod === 'cod' ? '#856404' : '#004085'
                    }}>
                      {order.paymentMethod === 'cod' ? '💵 COD' : '💳 Razorpay'}
                    </span>
                  </td>
                  <td>{order.refund?.reason || 'N/A'}</td>
                  <td>{order.refund?.requestedAt ? new Date(order.refund.requestedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {order.paymentMethod === 'cod' ? (
                      <button 
                        onClick={() => processRefund(order._id)}
                        disabled={processingRefund === order._id}
                        className="action-btn refund-btn"
                        title="Click after receiving returned item"
                      >
                        {processingRefund === order._id ? '⏳ Approving...' : '✓ Approve Return'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => processRefund(order._id)}
                        disabled={processingRefund === order._id}
                        className="action-btn refund-btn"
                      >
                        {processingRefund === order._id ? '⏳ Processing...' : '💰 Process Refund'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td>{o._id}</td>
                <td>{(o.user && o.user.email) || 'N/A'}</td>
                <td>₹{o.total.toFixed(2)}</td>
                <td><span className={`payment-badge ${o.paymentStatus}`}>{o.paymentMethod} / {o.paymentStatus}</span></td>
                <td><span className={`status-badge ${o.orderStatus}`}>{o.orderStatus}</span></td>
                <td>{getButtonForStatus(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
