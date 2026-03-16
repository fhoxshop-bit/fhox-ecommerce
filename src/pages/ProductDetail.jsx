import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [flashDealInfo, setFlashDealInfo] = useState(null);
  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Get flash deal info from URL params
  useEffect(() => {
    const flashDealId = searchParams.get('flashDealId');
    const flashDealDiscount = searchParams.get('flashDealDiscount');
    
    if (flashDealId && flashDealDiscount) {
      setFlashDealInfo({
        id: flashDealId,
        discount: parseInt(flashDealDiscount)
      });
    }
  }, [searchParams]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load product', err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
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
    
    setInWishlist(wishlist.includes(id));
  }, [id, isLoggedIn, user]);

  const handleAddToCart = () => {
    console.log('=== ADD TO CART CLICKED ===');
    console.log('Selected size:', selectedSize);
    console.log('Flash deal info:', flashDealInfo);
    
    if (!isLoggedIn()) {
      console.log('User not logged in');
      openAuthModal('login');
      return;
    }
    
    // SIZE IS MANDATORY - CHECK FIRST
    if (!selectedSize || selectedSize.trim() === '') {
      console.log('SIZE NOT SELECTED - BLOCKING ADD TO CART');
      const msg = '❌ YOU MUST SELECT A SIZE FIRST!\n\nPlease choose S, M, L, XL, XXL, or XXXL from the size buttons above.';
      window.alert(msg);
      return; // STOP HERE - DO NOT ADD TO CART
    }
    
    console.log('Size validation PASSED. Size:', selectedSize);
    console.log('Adding to cart with size:', selectedSize);
    
    let cartItem = { ...product, size: selectedSize };
    
    // Add flash deal info if present
    if (flashDealInfo) {
      cartItem.flashDealId = flashDealInfo.id;
      cartItem.flashDealDiscount = flashDealInfo.discount;
      console.log('🔥 Flash deal added to cart item:', {
        discount: flashDealInfo.discount,
        id: flashDealInfo.id
      });
    }
    
    addToCart(cartItem);
    console.log('Item added to cart successfully:', cartItem);
    // NO ALERT - just silently add to cart
    // Size selector stays visible so user knows what was added
  };

  const handleWishlist = () => {
    if (!isLoggedIn()) {
      openAuthModal('login');
      return;
    }
    
    let wishlist = [];
    const storageKey = user ? `wishlist_${user.id}` : 'guest_wishlist';
    const storage = user ? localStorage : sessionStorage;
    
    const savedWishlist = storage.getItem(storageKey);
    if (savedWishlist) {
      wishlist = JSON.parse(savedWishlist);
    }
    
    if (inWishlist) {
      const newWishlist = wishlist.filter(item => item !== id);
      storage.setItem(storageKey, JSON.stringify(newWishlist));
      setInWishlist(false);
    } else {
      wishlist.push(id);
      storage.setItem(storageKey, JSON.stringify(wishlist));
      setInWishlist(true);
    }
    
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <div className="product-content">
          <div className="product-image-section">
            <img src={product.imageUrl || product.image || '/images/apparel.png'} alt={product.name} />
          </div>
          
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            
            {flashDealInfo && (
              <div className="flash-deal-badge-info">
                <span className="flash-deal-icon">⚡</span>
                <span className="flash-deal-text">FLASH DEAL: {flashDealInfo.discount}% OFF!</span>
              </div>
            )}
            
            {product.actualPrice && product.discountPrice && ( 
              <div className="product-pricing-container">
                <div className="product-price-row">
                  <span className="actual-price">₹{product.actualPrice}</span>
                  <span className="discount-percent">
                    {Math.round(((product.actualPrice - product.discountPrice) / product.actualPrice) * 100)}% OFF
                  </span>
                </div>
                <div className="product-discount-price">
                  ₹{product.discountPrice}
                  {flashDealInfo && (
                    <span className="flash-deal-price">
                      {' → '}
                      <strong>₹{Math.round(product.discountPrice * (1 - flashDealInfo.discount / 100))}</strong>
                      <span className="flash-tag"> (with flash deal)</span>
                    </span>
                  )}
                </div>
              </div>
            )}
            {(!product.actualPrice || !product.discountPrice) && (
              <div className="product-price">
                ₹{product.price}
                {flashDealInfo && (
                  <span className="flash-deal-price">
                    {' → '}
                    <strong>₹{Math.round(product.price * (1 - flashDealInfo.discount / 100))}</strong>
                    <span className="flash-tag"> (with flash deal)</span>
                  </span>
                )}
              </div>
            )}
            <p className="product-description">{product.description || 'No description available'}</p>
            
            <div className="product-availability">
              {product.stock > 0 ? (
                <span className="available">Product available</span>
              ) : (
                <span className="unavailable">Out of stock</span>
              )}
            </div>

            {/* SIZE SELECTOR - BUTTON STYLE */}
            <div style={{ margin: '20px 0', padding: '20px', backgroundColor: 'rgba(255, 107, 107, 0.2)', border: '3px solid #ff2b2b', borderRadius: '8px' }}>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '15px', textAlign: 'center' }}>
                📏 SELECT YOUR SIZE (REQUIRED):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => {
                  const sizeStock = product.sizeStock ? product.sizeStock[size] : 0;
                  const isOutOfStock = sizeStock === 0 || sizeStock === undefined;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      style={{
                        padding: '12px 8px',
                        background: selectedSize === size ? '#ff2b2b' : isOutOfStock ? 'rgba(100, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        color: isOutOfStock ? '#999' : '#fff',
                        border: selectedSize === size ? '3px solid #fff' : isOutOfStock ? '2px solid rgba(150, 150, 150, 0.3)' : '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedSize === size ? '0 4px 12px rgba(255, 43, 43, 0.4)' : 'none',
                        transform: selectedSize === size ? 'scale(1.05)' : 'scale(1)',
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
              {selectedSize && (
                <p style={{ marginTop: '10px', color: '#4ade80', fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }}>
                  ✓ Size <strong>{selectedSize}</strong> is selected!
                </p>
              )}
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].some(size => (product.sizeStock ? product.sizeStock[size] === 0 : false)) && (
                <p style={{ marginTop: '10px', color: '#fbbf24', fontSize: '13px', textAlign: 'center' }}>
                  ⚠️ Sizes marked with ✕ are out of stock
                </p>
              )}
            </div>

            {/* ADD TO CART BUTTON */}
            <div className="product-actions">
              <button 
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedSize}
                style={{
                  padding: '14px 20px',
                  background: selectedSize ? 'linear-gradient(135deg, #4ade80, #22c55e)' : '#9ca3af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: selectedSize ? 'pointer' : 'not-allowed',
                  opacity: selectedSize ? 1 : 0.6,
                  flex: 1,
                  minWidth: '140px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {selectedSize ? `✓ ADD TO CART (${selectedSize})` : '👆 SELECT SIZE FIRST'}
              </button>
              
              <button 
                type="button"
                className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`} 
                onClick={handleWishlist}
              >
                {inWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}