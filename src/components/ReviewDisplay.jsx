import React from 'react';
import './ReviewDisplay.css';

const StarRating = ({ rating }) => {
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
    </div>
  );
};

export default function ReviewDisplay({ reviews = [], averageRating = 0, totalReviews = 0, showProductInfo = false, products = [] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const getProductInfo = (productId) => {
    return products.find(p => String(p.id) === String(productId));
  };

  return (
    <div className="reviews-container">
      {showProductInfo && (
        <div className="reviews-summary">
          <div className="rating-summary">
            <div className="avg-rating">{averageRating.toFixed(1)}</div>
            <StarRating rating={Math.round(averageRating)} />
            <div className="total-reviews">({totalReviews} reviews)</div>
          </div>
        </div>
      )}

      <div className="reviews-list">
        {reviews.map((review, index) => {
          const product = showProductInfo ? getProductInfo(review.productId) : null;
          return (
            <div key={index} className="review-item">
              {product && (
                <div className="review-product-info">
                  <img 
                    src={product.imageUrl || product.image || '/images/apparel.png'} 
                    alt={product.name}
                    className="review-product-image"
                  />
                  <div className="review-product-details">
                    <h4>{product.name}</h4>
                    <p className="product-price">₹{product.price}</p>
                  </div>
                </div>
              )}

              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.customerName}</span>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <StarRating rating={review.rating} />
              </div>

              <p className="review-text">{review.reviewText}</p>

              {review.verified && (
                <span className="verified-badge">✓ Verified Purchase</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
