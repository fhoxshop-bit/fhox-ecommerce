import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getVideoUrl } from '../utils/cloudinaryVideoService';
import ReviewForm from '../components/ReviewForm';
import ReviewDisplay from '../components/ReviewDisplay';
import './Collection.css';

export default function Collection() {
  const [selected, setSelected] = useState('');
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalSelectedSize, setModalSelectedSize] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Auto-select category from URL query parameter
  useEffect(() => {
    const category = searchParams.get('category')
    if (category) setSelected(category)
  }, [searchParams])

  // Fetch products and flash deals - hide products in active flash deals from collection
  useEffect(() => {
    let mounted = true
    
    const fetchProductsAndDeals = async () => {
      try {
        // Fetch products
        const productsRes = await fetch('/api/products')
        const productsData = await productsRes.json()
        
        // Fetch active flash deals
        const dealsRes = await fetch('/api/flash-deals/active')
        const dealsData = await dealsRes.json()
        
        // Get IDs of products in active flash deals
        const flashDealProductIds = new Set(dealsData.map(deal => deal.productId))
        
        // Filter out products that are in active flash deals
        const filteredProducts = productsData.filter(product => !flashDealProductIds.has(product.id))
        
        if (mounted) setProducts(filteredProducts)
      } catch (err) {
        console.error('Failed to load products or deals', err)
        if (mounted) setProducts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    // Initial fetch
    fetchProductsAndDeals()
    
    // Set up auto-refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      fetchProductsAndDeals()
    }, 5000)
    
    return () => { 
      mounted = false
      clearInterval(refreshInterval)
    }
  }, [])

  const genderMatches = (productGender, target) => {
    if (!productGender) return false
    const g = productGender.toString().toLowerCase().trim()
    // Exact matching to prevent products appearing in multiple categories
    if (target === 'Men') return g === 'men' || g === 'male' || g === 'men\'s' || g === 'male\'s'
    if (target === 'Women') return g === 'women' || g === 'female' || g === 'women\'s' || g === 'female\'s'
    return false
  }

  const openProductModal = (product) => {
    setSelectedProduct(product);
    
    // Check if product is in wishlist
    let wishlist = [];
    
    if (isLoggedIn() && user) {
      // Check user's wishlist
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        wishlist = JSON.parse(savedWishlist);
      }
    } else {
      // Check guest wishlist
      const guestWishlist = sessionStorage.getItem('guest_wishlist');
      if (guestWishlist) {
        wishlist = JSON.parse(guestWishlist);
      }
    }
    
    if (!Array.isArray(wishlist)) wishlist = [];
    wishlist = wishlist.map(String);
    setInWishlist(wishlist.includes(String(product.id)));
    
    // Fetch reviews for this product
    setReviewsLoading(true);
    fetch(`/api/reviews/product/${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductReviews(data.reviews);
          setAverageRating(data.averageRating);
        }
      })
      .catch(err => console.error('Failed to load reviews:', err))
      .finally(() => setReviewsLoading(false));
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setModalSelectedSize('');
  };

  const handleModalAddToCart = () => {
    if (!isLoggedIn()) {
      openAuthModal('login');
      return;
    }
    
    // SIZE IS REQUIRED - CHECK FIRST
    if (!modalSelectedSize || modalSelectedSize.trim() === '') {
      window.alert('❌ YOU MUST SELECT A SIZE FIRST!\n\nPlease choose S, M, L, XL, XXL, or XXXL from the options above.');
      return;
    }
    
    if (selectedProduct) {
      const cartItem = { ...selectedProduct, size: modalSelectedSize };
      addToCart(cartItem);
      console.log('Item added to cart from modal:', cartItem);
      // Close modal after adding - NO ALERT NEEDED
      closeProductModal();
    }
  };

  const handleModalWishlist = () => {
    if (!isLoggedIn()) {
      openAuthModal('login');
      return;
    }

    if (selectedProduct) {
      let wishlist = [];
      const storageKey = user ? `wishlist_${user.id}` : 'guest_wishlist';
      const storage = user ? localStorage : sessionStorage;
      
      const savedWishlist = storage.getItem(storageKey);
      if (savedWishlist) {
        wishlist = JSON.parse(savedWishlist);
      }
      
      if (!Array.isArray(wishlist)) wishlist = [];
      wishlist = wishlist.map(String);

      const idStr = String(selectedProduct.id);
      if (inWishlist) {
        const newWishlist = wishlist.filter(item => item !== idStr);
        storage.setItem(storageKey, JSON.stringify(newWishlist));
        setInWishlist(false);
      } else {
        wishlist.push(idStr);
        storage.setItem(storageKey, JSON.stringify(wishlist));
        setInWishlist(true);
      }
      // notify other components that wishlist changed
      window.dispatchEvent(new Event('wishlistUpdated'));
    }
  };

  const renderCategoryContent = () => {
    if (loading) return <div className="product-grid">Loading...</div>

    const items = products
      .filter(p => p.active !== false)
      .filter(p => genderMatches(p.gender || p.Gender || p.gender, selected))
    
    // Show welcome message if no category selected
    if (!selected) {
      return (
        <div className="empty-state">
          <div className="empty-state-content">
            <h2>👋 Welcome to FHOX Collections</h2>
            <p>Select <strong>Men</strong> or <strong>Women</strong> above to explore our amazing collection</p>
            <div className="empty-state-icons">
              <span>👔</span>
              <span>👗</span>
            </div>
          </div>
        </div>
      )
    }
    
    if (items.length === 0) return null

    return (
      <div className="product-grid animate-fade">
        <div className="grid-header">
          <h2>{selected}</h2>
          <p>
            {selected === 'Men'
              ? '👑 FHOX Men — Confidence in motion, power in every step'
              : selected === 'Women'
              ? '👸 FHOX Women — Style is the fire in your mindset, the grace in your motion'
              : 'Explore our collection'}
          </p>
        </div>
        <div className="products">
          {items.map(product => {
            // Calculate discount percentage
            const discountPercent = product.actualPrice && product.discountPrice 
              ? Math.round(((product.actualPrice - product.discountPrice) / product.actualPrice) * 100)
              : 0;
            
            return (
            <div key={product.id} className={`product-card ${product.stock <= 0 ? 'out-of-stock' : ''}`} onClick={() => openProductModal(product)}>
              <div className="product-image">
                <img src={product.imageUrl || product.image || '/images/apparel.png'} alt={product.name} />
                {discountPercent > 0 && (
                  <div className="discount-badge">{discountPercent}% OFF</div>
                )}
              </div>
              <div className="product-name">{product.name}</div>
              <div className="product-stock">
                {product.stock > 0 ? (
                  <span className="in-stock">Stock available</span>
                ) : (
                  <span className="out-stock">Out of stock</span>
                )}
              </div>
              {product.stock > 0 && (
                <button className="add-to-cart-btn" onClick={(e) => { 
                  e.stopPropagation();
                  openProductModal(product);
                }}>
                  🔍 View & Add to Cart
                </button>
              )}
            </div>
            );
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="collection-page">
      {/* collection page banner */}
      <div className="collection-video-banner">
        <video 
          className="banner-video" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={getVideoUrl('72564-543910238.mp4')} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay for better text readability */}
        <div className="banner-overlay"></div>
        
        {/* Text Content */}
        <div className="banner-content">
          <h1 className="banner-title">Our Collections</h1>
          <p className="banner-subtitle">Discover FHOX's amazing collection</p>
        </div>
      </div>

      {/* categories navigation */}
      <div className="category-bar">
        <button 
          onClick={() => setSelected('Men')}
          className={selected === 'Men' ? 'active' : ''}
        >
          Men
        </button>
        <span className="sep" />
        <button 
          onClick={() => setSelected('Women')}
          className={selected === 'Women' ? 'active' : ''}
        >
          Women
        </button>
      </div>

      <div className="page-content">
        {/* collection title replaced */}
        <p>🔥 FHOX reminds you: you are not ordinary, you are the statement.</p>
        {renderCategoryContent()}
      </div>

      {/* Product Modal Overlay */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={closeProductModal}>
          <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-back-btn" onClick={closeProductModal}>← Back</button>
            
            <div className="modal-product-container">
              <div className="modal-product-image">
                <img src={selectedProduct.imageUrl || selectedProduct.image || '/images/apparel.png'} alt={selectedProduct.name} />
              </div>
              
              <div className="modal-product-info">
                <h2 className="modal-product-title">{selectedProduct.name}</h2>
                {selectedProduct.actualPrice && selectedProduct.discountPrice ? (
                  <div className="modal-product-pricing-section">
                    <div className="modal-price-row">
                      <span className="modal-actual-price">₹{selectedProduct.actualPrice}</span>
                      <span className="modal-discount-percent">
                        {Math.round(((selectedProduct.actualPrice - selectedProduct.discountPrice) / selectedProduct.actualPrice) * 100)}% OFF
                      </span>
                    </div>
                    <div className="modal-product-price">₹{selectedProduct.discountPrice}</div>
                  </div>
                ) : (
                  <div className="modal-product-price">₹{selectedProduct.price}</div>
                )}
                
                {/* Product Rating Display */}
                <div className="modal-product-rating">
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(averageRating) ? 'star filled' : 'star'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-value">{averageRating.toFixed(1)}</span>
                  <span className="rating-count">({productReviews.length} reviews)</span>
                </div>
                
                <p className="modal-product-description">{selectedProduct.description || 'No description available'}</p>
                
                <div className="modal-product-availability">
                  {selectedProduct.stock > 0 ? (
                    <span className="modal-available">Product available</span>
                  ) : (
                    <span className="modal-unavailable">Out of stock</span>
                  )}
                </div>
                
                {/* SIZE SELECTOR IN MODAL */}
                {selectedProduct.stock > 0 && (
                  <div style={{ margin: '20px 0', padding: '20px', backgroundColor: 'rgba(255, 107, 107, 0.2)', border: '3px solid #ff2b2b', borderRadius: '8px' }}>
                    <label style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '15px', textAlign: 'center' }}>
                      📏 SELECT YOUR SIZE (REQUIRED):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => {
                        const sizeStock = selectedProduct.sizeStock ? selectedProduct.sizeStock[size] : 0;
                        const isOutOfStock = sizeStock === 0 || sizeStock === undefined;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => !isOutOfStock && setModalSelectedSize(size)}
                            disabled={isOutOfStock}
                            style={{
                              padding: '12px 8px',
                              background: modalSelectedSize === size ? '#ff2b2b' : isOutOfStock ? 'rgba(100, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                              color: isOutOfStock ? '#999' : '#fff',
                              border: modalSelectedSize === size ? '3px solid #fff' : isOutOfStock ? '2px solid rgba(150, 150, 150, 0.3)' : '2px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: modalSelectedSize === size ? '0 4px 12px rgba(255, 43, 43, 0.4)' : 'none',
                              transform: modalSelectedSize === size ? 'scale(1.05)' : 'scale(1)',
                              position: 'relative'
                            }}
                            title={isOutOfStock ? `${size} - Out of Stock` : `${size} - ${sizeStock} in stock`}
                          >
                            {size}
                            {isOutOfStock && (
                              <div style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#ff2b2b',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                ✕
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {modalSelectedSize && (
                      <p style={{ marginTop: '10px', color: '#4ade80', fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>
                        ✓ Size <strong>{modalSelectedSize}</strong> is selected!
                      </p>
                    )}
                    {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].some(size => (selectedProduct.sizeStock ? selectedProduct.sizeStock[size] === 0 : false)) && (
                      <p style={{ marginTop: '10px', color: '#fbbf24', fontSize: '13px', textAlign: 'center' }}>
                        ⚠️ Sizes marked with ✕ are out of stock
                      </p>
                    )}
                  </div>
                )}
                
                <div className="modal-product-actions">
                  {selectedProduct.stock > 0 && (
                    <button 
                      className="modal-add-to-cart-btn" 
                      onClick={handleModalAddToCart}
                      disabled={!modalSelectedSize}
                      style={{
                        opacity: modalSelectedSize ? 1 : 0.6,
                        cursor: modalSelectedSize ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {modalSelectedSize ? `✓ ADD TO CART (${modalSelectedSize})` : '👆 SELECT SIZE FIRST'}
                    </button>
                  )}
                  
                  <button 
                    className={`modal-wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`} 
                    onClick={handleModalWishlist}
                  >
                    {inWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Reviews Section in Modal */}
            <div className="modal-reviews-section">
              <ReviewForm productId={selectedProduct.id} onReviewAdded={() => {
                // Reload reviews after new review is added
                fetch(`/api/reviews/product/${selectedProduct.id}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      setProductReviews(data.reviews);
                      setAverageRating(data.averageRating);
                    }
                  });
              }} />
              
              <div className="modal-existing-reviews">
                <h3>Customer Reviews</h3>
                {reviewsLoading ? (
                  <p>Loading reviews...</p>
                ) : (
                  <ReviewDisplay reviews={productReviews} averageRating={averageRating} totalReviews={productReviews.length} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
