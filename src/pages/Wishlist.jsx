import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getLogoUrl } from '../utils/cloudinaryImageService';
import './Wishlist.css';

export default function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    const loadWishlist = async () => {
      let ids = [];
      
      if (isLoggedIn() && user) {
        // Load user's wishlist
        const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
        if (savedWishlist) {
          ids = JSON.parse(savedWishlist);
        }
      } else {
        // Load guest wishlist (tab-specific)
        const guestWishlist = sessionStorage.getItem('guest_wishlist');
        if (guestWishlist) {
          ids = JSON.parse(guestWishlist);
        }
      }
      
      if (!Array.isArray(ids)) ids = [];
      ids = ids.map(String);
      if (ids.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        // make sure product ids are strings for comparison
        const filtered = data.filter(p => ids.includes(String(p.id)));
        setWishlistProducts(filtered);
      } catch (err) {
        console.error('Failed to load wishlist products', err);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
    const update = () => loadWishlist();
    window.addEventListener('wishlistUpdated', update);
    window.addEventListener('authChanged', update);
    return () => {
      window.removeEventListener('wishlistUpdated', update);
      window.removeEventListener('authChanged', update);
    };
  }, [isLoggedIn, user]);

  const removeFromWishlist = (productId) => {
    const idStr = String(productId);
    let list = [];
    
    if (isLoggedIn() && user) {
      // Update user's wishlist
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        list = JSON.parse(savedWishlist);
      }
      if (!Array.isArray(list)) list = [];
      const newList = list.map(String).filter(id => id !== idStr);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newList));
    } else {
      // Update guest wishlist
      const guestWishlist = sessionStorage.getItem('guest_wishlist');
      if (guestWishlist) {
        list = JSON.parse(guestWishlist);
      }
      if (!Array.isArray(list)) list = [];
      const newList = list.map(String).filter(id => id !== idStr);
      sessionStorage.setItem('guest_wishlist', JSON.stringify(newList));
    }
    
    setWishlistProducts(prev => prev.filter(p => String(p.id) !== idStr));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  if (loading) return <div className="wishlist-page">Loading...</div>;

  if (!isLoggedIn()) {
    return (
      <div className="wishlist-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>🔐 Login Required</h2>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
          Please login or register to view your wishlist
        </p>
        <button 
          onClick={() => openAuthModal('login')}
          style={{
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
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="wishlist-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <img src={getLogoUrl('fhox.png')} alt="FHOX Logo" style={{ width: '200px', marginBottom: '30px', opacity: 0.8 }} />
          <h2>Your wishlist is empty</h2>
          <p>Browse our collection and add items you love.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
        <img src={getLogoUrl('fhox.png')} alt="FHOX Logo" style={{ width: '150px', marginBottom: '20px', opacity: 0.8 }} />
      </div>
      <h2>My Wishlist</h2>
      <div className="product-grid">
        {wishlistProducts.map(product => {
          const discountPercent = product.actualPrice && product.discountPrice 
            ? Math.round(((product.actualPrice - product.discountPrice) / product.actualPrice) * 100)
            : 0;
          
          return (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <img src={product.imageUrl || product.image || '/images/apparel.png'} alt={product.name} />
              {discountPercent > 0 && (
                <div className="discount-badge">{discountPercent}% OFF</div>
              )}
            </div>
            <div className="product-name">{product.name}</div>
            {product.discountPrice && product.actualPrice ? (
              <div className="product-price-section">
                <span className="actual-price">₹{product.actualPrice}</span>
                <span className="discount-price">₹{product.discountPrice}</span>
              </div>
            ) : (
              <div className="product-price">₹{product.price}</div>
            )}
            <div className="product-actions">
              <button onClick={() => addToCart(product)}>Add to Cart</button>
              <button className="remove-btn" onClick={() => removeFromWishlist(product.id)}>Remove</button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
