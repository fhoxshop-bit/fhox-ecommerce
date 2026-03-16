import React, { useState, useEffect } from 'react';
import ReviewDisplay from '../components/ReviewDisplay';
import './Reviews.css';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const reviewsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all reviews
        const reviewsRes = await fetch('http://localhost:5000/api/reviews');
        const reviewsData = await reviewsRes.json();

        // Fetch all products for reference
        const productsRes = await fetch('http://localhost:5000/api/products');
        const productsData = await productsRes.json();

        if (reviewsData.success) {
          setReviews(reviewsData.reviews);
        }
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sort and paginate reviews
  useEffect(() => {
    let sorted = [...reviews];

    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'highest') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      sorted.sort((a, b) => a.rating - b.rating);
    }

    const startIdx = (currentPage - 1) * reviewsPerPage;
    const endIdx = startIdx + reviewsPerPage;
    setDisplayedReviews(sorted.slice(startIdx, endIdx));
  }, [reviews, currentPage, sortBy]);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const getProductInfo = (productId) => {
    return products.find(p => String(p.id) === String(productId));
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <>
      <div className="reviews-page">
        {/* Video Banner with Text Overlay */}
        <div className="reviews-video-banner">
          <video 
            className="banner-video" 
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src="/videos/4182916-uhd_3840_2160_30fps.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Overlay for better text readability */}
          <div className="banner-overlay"></div>
          
          {/* Text Content */}
          <div className="banner-content">
            <h1 className="banner-title">Customer Reviews</h1>
            <p className="banner-subtitle">See what our community loves about FHOX</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{reviews.length}</span>
                <span className="stat-label">Customer Reviews</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{avgRating}/5</span>
                <span className="stat-label">Community Rating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="reviews-page-content">
          {loading ? (
            <div className="loading-spinner">Loading amazing reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews-container">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <>
              <div className="reviews-controls">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}>
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>

              <div className="reviews-grid">
                {displayedReviews.map((review, index) => {
                  const product = getProductInfo(review.productId);
                  return (
                    <div key={index} className="review-card">
                      <div className="review-card-header">
                        <div className="reviewer-avatar">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="reviewer-meta">
                          <div className="reviewer-name">{review.customerName}</div>
                          <div className="review-meta-info">
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            {review.verified && <span className="verified-badge">✓ Verified</span>}
                          </div>
                        </div>
                        <div className="review-rating">
                          {'★'.repeat(review.rating)}
                        </div>
                      </div>

                      {product && (
                        <div className="review-product-ref">
                          <img src={product.imageUrl || product.image || '/images/apparel.png'} alt={product.name} />
                          <div>
                            <p className="prod-name">{product.name}</p>
                            <p className="prod-price">₹{product.price}</p>
                          </div>
                        </div>
                      )}

                      <p className="review-text">{review.reviewText}</p>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pag-btn" 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  <div className="page-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button 
                    className="pag-btn" 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
