import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MyCoupons.css';

export default function MyCoupons() {
  const { user, token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserCoupons();
      
      // Auto-refresh coupons every 10 seconds to detect when a coupon is used
      const refreshInterval = setInterval(fetchUserCoupons, 10000);
      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const fetchUserCoupons = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/coupons/user/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setCoupons(data.coupons);
        console.log(`[MyCoupons] Fetched ${data.coupons.length} available coupons`);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="my-coupons">
        <div className="coupons-header">
          <h2>🎟️ My Available Coupons</h2>
        </div>
        <div className="empty-coupons">
          <p>Loading your coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-coupons">
      <div className="coupons-header">
        <h2>🎟️ My Available Coupons</h2>
        <p>{coupons.length} coupon{coupons.length !== 1 ? 's' : ''} available</p>
      </div>

      {coupons.length === 0 ? (
        <div className="empty-coupons">
          <p>🎁 No coupons available yet!</p>
          <p className="hint">Check back soon for exclusive offers and special discounts</p>
        </div>
      ) : (
        <div className="coupons-grid">
          {coupons.map((coupon) => (
            <div key={coupon.assignmentId} className={`coupon-card ${coupon.isExpired ? 'expired' : ''}`}>
              <div className="coupon-header">
                <div className="coupon-code-section">
                  <p className="label">Coupon Code</p>
                  <div className="code-display">
                    <code>{coupon.code}</code>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(coupon.code)}
                      title="Copy code to clipboard"
                    >
                      {copiedCode === coupon.code ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
                <div className="discount-badge">
                  <span className="percent">{coupon.discountPercentage}%</span>
                  <span className="label">OFF</span>
                </div>
              </div>

              <div className="coupon-details">
                <div className="detail">
                  <span className="icon">💰</span>
                  <span className="text">
                    {coupon.minOrderValue > 0
                      ? `Min. ₹${coupon.minOrderValue}`
                      : 'No minimum order'}
                  </span>
                </div>

                <div className="detail">
                  <span className="icon">📅</span>
                  <span className={`text ${coupon.isExpired ? 'expired' : ''}`}>
                    Expires: {coupon.expiryDate}
                  </span>
                </div>

                {coupon.isExpired && (
                  <div className="expired-badge">⏰ EXPIRED</div>
                )}
              </div>

              {!coupon.isExpired && coupon.availableToUse && (
                <p className="coupon-hint">
                  ✓ Use this code at checkout to get {coupon.discountPercentage}% off your total!
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="coupon-info-section">
        <h3>📖 How to use your coupon:</h3>
        <ol>
          <li>Click the <strong>"Copy"</strong> button to copy the coupon code</li>
          <li>Go to <strong>checkout</strong> and paste the code in the coupon field</li>
          <li>Your <strong>discount will be applied</strong> to the total amount</li>
          <li>Discount applies to items + tax + shipping</li>
          <li>Each coupon can be used <strong>only once</strong> per account</li>
        </ol>
      </div>
    </div>
  );
}
