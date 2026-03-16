import React, { useState, useEffect } from 'react';
import './CouponManagement.css';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 10,
    expiryDate: '',
    minOrderValue: 0,
    targetSegment: 'ALL'
  });

  const [recipientCategory, setRecipientCategory] = useState('new');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [previewUsers, setPreviewUsers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [createdCoupon, setCreatedCoupon] = useState(null);

  // Fetch coupons on mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/coupons');
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    }
  };

  // Generate coupon
  const handleGenerateCoupon = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/coupons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setCreatedCoupon(data.coupon);
        setRecipientCategory(data.coupon.targetSegment.toLowerCase().replace('_', '-'));
        setFormData({
          code: '',
          discountPercentage: 10,
          expiryDate: '',
          minOrderValue: 0,
          targetSegment: 'ALL'
        });
        fetchCoupons();
        // Auto-load preview for Step 2
        setTimeout(() => {
          const category = data.coupon.targetSegment.toLowerCase().replace('_', '-');
          console.log(`[Coupon Preview] Fetching users for category: ${category}`);
          fetch(`http://localhost:5000/api/coupons/users-by-category?category=${category}`)
            .then(r => r.json())
            .then(d => {
              console.log(`[Coupon Preview] Response:`, d);
              if (d.success) {
                console.log(`[Coupon Preview] Got ${d.users.length} users`);
                setPreviewUsers(d.users);
                setSelectedUsers(d.users.map(u => u.id));
                setShowPreview(true);
              } else {
                console.error(`[Coupon Preview] API error:`, d.message);
              }
            })
            .catch(e => {
              console.error('[Coupon Preview] Fetch error:', e);
            });
        }, 500);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error generating coupon:', err);
      alert('Failed to generate coupon');
    } finally {
      setLoading(false);
    }
  };

  // Preview users for distribution
  const handlePreviewUsers = async () => {
    try {
      console.log(`[Coupon Preview] Fetching users for category: ${recipientCategory}`);
      const response = await fetch(
        `http://localhost:5000/api/coupons/users-by-category?category=${recipientCategory}`
      );
      const data = await response.json();
      console.log(`[Coupon Preview] Response:`, data);
      if (data.success) {
        console.log(`[Coupon Preview] Got ${data.users.length} users`);
        setPreviewUsers(data.users);
        setSelectedUsers(data.users.map(u => u.id));
        setShowPreview(true);
      } else {
        console.error(`[Coupon Preview] API error:`, data.message);
        alert(data.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('[Coupon Preview] Fetch error:', err);
      alert('Failed to load users');
    }
  };

  // Send coupon to selected users
  const handleSendCoupon = async () => {
    if (!createdCoupon) {
      alert('Please create a coupon first');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('http://localhost:5000/api/coupons/send-to-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponId: createdCoupon.id,
          userIds: selectedUsers
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✓ Coupon sent to ${data.sentCount} users`);
        setShowForm(false);
        setCreatedCoupon(null);
        setShowPreview(false);
        setPreviewUsers([]);
        setSelectedUsers([]);
        fetchCoupons();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error sending coupon:', err);
      alert('Failed to send coupon');
    } finally {
      setSending(false);
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/coupons/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchCoupons();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className="coupon-management">
      <div className="page-header">
        <h1>🎟️ Coupon Management</h1>
        <button className="btn-create" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ Create New Coupon'}
        </button>
      </div>

      {/* Create Coupon Form */}
      {showForm && (
        <div className="coupon-form-section">
          <h2>Generate & Distribute Coupon</h2>

          {/* Step 1: Create Coupon */}
          <div className="form-step">
            <h3>Step 1: Create Coupon</h3>
            <form onSubmit={handleGenerateCoupon} className="form-grid">
              <div className="form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g., SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount Percentage * (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercentage || ''}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 10 })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiry Date *</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Minimum Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.minOrderValue || ''}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Target Segment (Who gets this coupon?) *</label>
                <div className="segment-options">
                  <label>
                    <input
                      type="radio"
                      value="NEW"
                      checked={formData.targetSegment === 'NEW'}
                      onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    />
                    👤 New Users (last 30 days)
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="ALL"
                      checked={formData.targetSegment === 'ALL'}
                      onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    />
                    👥 All Users
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="TOP_BUYERS"
                      checked={formData.targetSegment === 'TOP_BUYERS'}
                      onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    />
                    ⭐ Top Buyers
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="INACTIVE"
                      checked={formData.targetSegment === 'INACTIVE'}
                      onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    />
                    😴 Inactive Users (30+ days)
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>

            {createdCoupon && (
              <div className="success-box">
                <p>✓ Coupon created successfully!</p>
                <p>
                  Code: <strong>{createdCoupon.code}</strong> | 
                  Discount: <strong>{createdCoupon.discountPercentage}%</strong>
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Send to Recipients */}
          {createdCoupon && (
            <div className="form-step">
              <h3>Step 2: Send to {formData.targetSegment} Users</h3>

              <p className="segment-info">
                This coupon will be sent to: <strong>
                  {formData.targetSegment === 'NEW' && '👤 New Users (last 30 days)'}
                  {formData.targetSegment === 'ALL' && '👥 All Users'}
                  {formData.targetSegment === 'TOP_BUYERS' && '⭐ Top Buyers'}
                  {formData.targetSegment === 'INACTIVE' && '😴 Inactive Users (30+ days)'}
                </strong>
              </p>

              <button 
                className="btn-secondary" 
                onClick={() => {
                  setRecipientCategory(formData.targetSegment.toLowerCase().replace('_', '-'));
                  handlePreviewUsers();
                }}
              >
                Preview Recipients
              </button>

              {/* User Preview */}
              {showPreview && (
                <div className="preview-section">
                  <h4>Recipients: {selectedUsers.length} users</h4>
                  <div className="users-list">
                    {previewUsers.map((user) => (
                      <div key={user.id} className="user-item">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <span>{user.name}</span>
                        <span className="email">{user.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="btn-success" 
                onClick={handleSendCoupon}
                disabled={sending || selectedUsers.length === 0 || !showPreview}
              >
                {sending ? 'Sending...' : `Send Coupon to ${selectedUsers.length} Users`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Coupons List */}
      <div className="coupons-list">
        <h2>All Coupons</h2>
        {coupons.length === 0 ? (
          <p className="empty-state">No coupons yet. Create one to get started!</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Expiry Date</th>
                  <th>Target Segment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  const segmentLabels = {
                    'NEW': '👤 New Users',
                    'ALL': '👥 All Users',
                    'TOP_BUYERS': '⭐ Top Buyers',
                    'INACTIVE': '😴 Inactive'
                  };
                  return (
                    <tr key={coupon.id}>
                      <td className="code">{coupon.code}</td>
                      <td>{coupon.discountPercentage}%</td>
                      <td>{coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue}` : '—'}</td>
                      <td>{coupon.expiryDate}</td>
                      <td>{segmentLabels[coupon.targetSegment] || coupon.targetSegment}</td>
                      <td>
                        <span className={`badge ${isExpired ? 'expired' : coupon.isActive ? 'active' : 'inactive'}`}>
                          {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDeleteCoupon(coupon.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
