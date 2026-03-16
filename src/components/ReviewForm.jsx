import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import './ReviewForm.css';

export default function ReviewForm({ productId, onReviewAdded }) {
  const { user, token, isLoggedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    reviewText: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-fill user data when logged in
  useEffect(() => {
    if (user && isLoggedIn()) {
      setFormData(prev => ({
        ...prev,
        customerName: user.customerName || '',
        customerEmail: user.email || ''
      }));
    }
  }, [user, isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/reviews/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          productId,
          rating: parseInt(formData.rating)
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Review added successfully!' });
        setFormData({
          customerName: user?.customerName || '',
          customerEmail: user?.email || '',
          rating: 5,
          reviewText: ''
        });
        if (onReviewAdded) onReviewAdded(result);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to add review' });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setMessage({ type: 'error', text: 'Failed to submit review. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!isLoggedIn()) {
    return (
      <div className="review-form-container">
        <h3>Write a Review</h3>
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#856404',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ marginBottom: '15px', fontSize: '16px' }}>
            Please login or register to write a review
          </p>
          <button
            onClick={() => openAuthModal('login')}
            style={{
              marginTop: '10px',
              padding: '12px 24px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: '600',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#ff5252'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ff6b6b'}
          >
            Login or Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h3>Write a Review</h3>
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label htmlFor="customerName">Your Name *</label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="customerEmail">Your Email *</label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            disabled
          />
        </div>

        <div className="form-group">
          <label>Rating * (Click to select)</label>
          <div className="star-rating-selector">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                type="button"
                className={`star-button ${num <= formData.rating ? 'filled' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, rating: num }))}
                title={`${num} ${num === 1 ? 'star' : 'stars'}`}
              >
                ★
              </button>
            ))}
          </div>
          <span className="rating-text">{formData.rating} out of 5 stars</span>
        </div>

        <div className="form-group">
          <label htmlFor="reviewText">Your Review *</label>
          <textarea
            id="reviewText"
            name="reviewText"
            value={formData.reviewText}
            onChange={handleChange}
            required
            minLength="10"
            placeholder="Write your review here (at least 10 characters)..."
            rows="5"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-review-btn">
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {message && (
        <div className={`review-message review-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
